module.exports = [
    ['link', {rel: 'icon', href: '/favicon.ico'}],
    ['script', {}, `
            var _hmt = _hmt || [];
            (function() {
            var hm = document.createElement("script");
            hm.src = "https://hm.baidu.com/hm.js?61e2d16dac6a568e22f28ee4974c119a";
            var s = document.getElementsByTagName("script")[0]; 
            s.parentNode.insertBefore(hm, s);
            })();
        `]
];