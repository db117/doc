import type {OptionType} from './types'

export interface OptionPricingInput {
    type: OptionType
    spot: number
    strike: number
    timeToExpiry: number
    volatility: number
    riskFreeRate: number
    dividendYield: number
}

const SQRT_TWO_PI = Math.sqrt(2 * Math.PI)

export function normalCdf(value: number): number {
    if (value <= -8) return 0
    if (value >= 8) return 1
    const absolute = Math.abs(value)
    const t = 1 / (1 + 0.2316419 * absolute)
    const density = Math.exp(-0.5 * absolute * absolute) / SQRT_TWO_PI
    const tail = density * t * (
        0.319381530 + t * (-0.356563782 + t * (1.781477937 + t * (-1.821255978 + t * 1.330274429)))
    )
    return value >= 0 ? 1 - tail : tail
}

function bivariateNormalCdf(a: number, b: number, correlation: number): number {
    // Five-point Gauss-Legendre approximation used by the reference Y2002 model.
    const weights = [0.018854042, 0.038088059, 0.0452707394, 0.038088059, 0.018854042]
    const nodes = [0.04691008, 0.23076534, 0.5, 0.76923466, 0.95308992]
    let correction = 0
    for (let index = 0; index < nodes.length; index += 1) {
        const scaled = nodes[index] * correlation
        const remaining = 1 - scaled ** 2
        correction += weights[index]
            * Math.exp((2 * a * b * scaled - a ** 2 - b ** 2) / remaining / 2)
            / Math.sqrt(remaining)
    }
    return correlation * correction + normalCdf(a) * normalCdf(b)
}

export function europeanOptionPrice(input: OptionPricingInput): number {
    const {type, spot, strike, timeToExpiry, volatility, riskFreeRate, dividendYield} = input
    if (timeToExpiry <= 0) return intrinsicValue(type, spot, strike)
    if (spot <= 0 || strike <= 0) return type === 'PUT' ? strike : 0
    if (volatility <= 1e-8) {
        const forwardSpot = spot * Math.exp((riskFreeRate - dividendYield) * timeToExpiry)
        const discounted = Math.exp(-riskFreeRate * timeToExpiry)
            * intrinsicValue(type, forwardSpot, strike)
        return Math.max(intrinsicValue(type, spot, strike), discounted)
    }
    const sigmaRootT = volatility * Math.sqrt(timeToExpiry)
    const d1 = (
        Math.log(spot / strike)
        + (riskFreeRate - dividendYield + 0.5 * volatility * volatility) * timeToExpiry
    ) / sigmaRootT
    const d2 = d1 - sigmaRootT
    const spotPv = spot * Math.exp(-dividendYield * timeToExpiry)
    const strikePv = strike * Math.exp(-riskFreeRate * timeToExpiry)
    return type === 'CALL'
        ? spotPv * normalCdf(d1) - strikePv * normalCdf(d2)
        : strikePv * normalCdf(-d2) - spotPv * normalCdf(-d1)
}

export function americanOptionPrice(input: OptionPricingInput): number {
    const {type, spot, strike, timeToExpiry, volatility, riskFreeRate} = input
    if (type === 'CALL' && input.dividendYield <= 0) return europeanOptionPrice(input)
    const dividendYield = Math.max(input.dividendYield, 1e-8)
    if (timeToExpiry <= 0) return intrinsicValue(type, spot, strike)
    if (spot <= 0 || strike <= 0) return type === 'PUT' ? strike : 0
    if (volatility <= 0.005) return intrinsicValue(type, spot, strike)

    const carry = riskFreeRate - dividendYield
    const price = type === 'CALL'
        ? americanCall2002(spot, strike, timeToExpiry, riskFreeRate, carry, volatility)
        : americanCall2002(
            strike,
            spot,
            timeToExpiry,
            riskFreeRate - carry,
            -carry,
            volatility,
        )
    const intrinsic = intrinsicValue(type, spot, strike)
    return Number.isFinite(price) ? Math.max(intrinsic, price) : intrinsic
}

export function intrinsicValue(type: OptionType, spot: number, strike: number): number {
    return type === 'CALL' ? Math.max(spot - strike, 0) : Math.max(strike - spot, 0)
}

function americanCall2002(
    spot: number,
    strike: number,
    time: number,
    rate: number,
    carry: number,
    volatility: number,
): number {
    // Without dividends, early exercise of an American call is never optimal.
    if (carry >= rate) {
        return europeanOptionPrice({
            type: 'CALL', spot, strike, timeToExpiry: time, volatility,
            riskFreeRate: rate, dividendYield: rate - carry,
        })
    }

    const variance = volatility * volatility
    const beta = 0.5 - carry / variance
        + Math.sqrt((carry / variance - 0.5) ** 2 + 2 * rate / variance)
    const boundaryInfinity = beta / (beta - 1) * strike
    const boundaryZero = Math.max(strike, rate / (rate - carry) * strike)
    const boundary2 = exerciseBoundary(time, carry, strike, volatility, boundaryInfinity, boundaryZero)
    const alpha2 = (boundary2 - strike) * boundary2 ** -beta
    if (spot >= boundary2) return spot - strike

    const time1 = 0.5 * (Math.sqrt(5) - 1) * time
    const boundary1 = exerciseBoundary(time - time1, carry, strike, volatility, boundaryInfinity, boundaryZero)
    const alpha1 = (boundary1 - strike) * boundary1 ** -beta

    let price = 0
    if (alpha1 !== 0) {
        price += alpha2 * spot ** beta
            - alpha2 * phi(spot, time1, beta, boundary2, boundary2, rate, carry, volatility)
            + alpha1 * phi(spot, time1, beta, boundary1, boundary2, rate, carry, volatility)
            - alpha1 * psi(spot, time, beta, boundary1, boundary2, boundary1, time1, rate, carry, volatility)
    }
    return price + (
        phi(spot, time1, 1, boundary2, boundary2, rate, carry, volatility)
        - phi(spot, time1, 1, boundary1, boundary2, rate, carry, volatility)
        - strike * phi(spot, time1, 0, boundary2, boundary2, rate, carry, volatility)
        + strike * phi(spot, time1, 0, boundary1, boundary2, rate, carry, volatility)
        + psi(spot, time, 1, boundary1, boundary2, boundary1, time1, rate, carry, volatility)
        - psi(spot, time, 1, strike, boundary2, boundary1, time1, rate, carry, volatility)
        - strike * psi(spot, time, 0, boundary1, boundary2, boundary1, time1, rate, carry, volatility)
        + strike * psi(spot, time, 0, strike, boundary2, boundary1, time1, rate, carry, volatility)
    )
}

function exerciseBoundary(
    time: number,
    carry: number,
    strike: number,
    volatility: number,
    infinity: number,
    zero: number,
): number {
    const exponent = -(
        strike * strike / ((infinity - zero) * zero)
        * (carry * time + 2 * volatility * Math.sqrt(time))
    )
    return zero + (infinity - zero) * (1 - Math.exp(exponent))
}

function phi(
    spot: number,
    time: number,
    gamma: number,
    boundary: number,
    upperBoundary: number,
    rate: number,
    carry: number,
    volatility: number,
): number {
    const lambda = -rate + gamma * carry + 0.5 * gamma * (gamma - 1) * volatility ** 2
    const kappa = 2 * carry / volatility ** 2 + 2 * gamma - 1
    const drift = (carry + (gamma - 0.5) * volatility ** 2) * time
    const sigmaRootT = volatility * Math.sqrt(time)
    const first = normalCdf(-(Math.log(spot / boundary) + drift) / sigmaRootT)
    const second = normalCdf(-(Math.log(upperBoundary ** 2 / (spot * boundary)) + drift) / sigmaRootT)
    return Math.exp(lambda * time) * spot ** gamma
        * (first - (upperBoundary / spot) ** kappa * second)
}

function psi(
    spot: number,
    time: number,
    gamma: number,
    boundary: number,
    upperBoundary: number,
    lowerBoundary: number,
    time1: number,
    rate: number,
    carry: number,
    volatility: number,
): number {
    const lambda = -rate + gamma * carry + 0.5 * gamma * (gamma - 1) * volatility ** 2
    const kappa = 2 * carry / volatility ** 2 + 2 * gamma - 1
    const sigmaRootT1 = volatility * Math.sqrt(time1)
    const sigmaRootT = volatility * Math.sqrt(time)
    const drift1 = (carry + (gamma - 0.5) * volatility ** 2) * time1
    const drift = (carry + (gamma - 0.5) * volatility ** 2) * time
    const upperPower = (upperBoundary / spot) ** kappa
    const lowerPower = (lowerBoundary / spot) ** kappa
    const ratioPower = (lowerBoundary / upperBoundary) ** kappa
    const correlation = Math.sqrt(time1 / time)

    return Math.exp(lambda * time) * spot ** gamma * (
        bivariateNormalCdf(
            -(Math.log(spot / lowerBoundary) + drift1) / sigmaRootT1,
            -(Math.log(spot / boundary) + drift) / sigmaRootT,
            correlation,
        )
        - upperPower * bivariateNormalCdf(
            -(Math.log(upperBoundary ** 2 / (spot * lowerBoundary)) + drift1) / sigmaRootT1,
            -(Math.log(upperBoundary ** 2 / (spot * boundary)) + drift) / sigmaRootT,
            correlation,
        )
        - lowerPower * bivariateNormalCdf(
            -(Math.log(spot / lowerBoundary) - drift1) / sigmaRootT1,
            -(Math.log(lowerBoundary ** 2 / (spot * boundary)) + drift) / sigmaRootT,
            -correlation,
        )
        + ratioPower * bivariateNormalCdf(
            -(Math.log(upperBoundary ** 2 / (spot * lowerBoundary)) - drift1) / sigmaRootT1,
            -(Math.log(spot * lowerBoundary ** 2 / (boundary * upperBoundary ** 2)) + drift) / sigmaRootT,
            -correlation,
        )
    )
}
