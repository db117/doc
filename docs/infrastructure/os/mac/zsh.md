---
title: zsh配置
---

# Oh My Zsh

## 安装

[ohmyzsh](https://github.com/ohmyzsh/ohmyzsh)

| Method    | Command                                                      |
| --------- | ------------------------------------------------------------ |
| **curl**  | `sh -c "$(curl -fsSL https://raw.githubusercontent.com/ohmyzsh/ohmyzsh/master/tools/install.sh)"` |
| **wget**  | `sh -c "$(wget -O- https://raw.githubusercontent.com/ohmyzsh/ohmyzsh/master/tools/install.sh)"` |
| **fetch** | `sh -c "$(fetch -o - https://raw.githubusercontent.com/ohmyzsh/ohmyzsh/master/tools/install.sh)"` |

### 配置文件

```
vim ~/.zshrc
```



## 更新

```
omz update
# 已过期
upgrade_oh_my_zsh
```

## 插件

### zsh-autosuggestions

> 命令行提示

[zsh-autosuggestions](https://github.com/void-linux/void-packages/blob/master/srcpkgs/zsh-autosuggestions/template)

1. 克隆仓库 `$ZSH_CUSTOM/plugins` (默认 `~/.oh-my-zsh/custom/plugins`)

   ```
   git clone https://github.com/zsh-users/zsh-autosuggestions ${ZSH_CUSTOM:-~/.oh-my-zsh/custom}/plugins/zsh-autosuggestions
   ```

2. 添加到配置文件 `~/.zshrc`):

   ```
   plugins=(zsh-autosuggestions)
   ```



#### zsh-syntax-highlighting

> 命令行高亮

[zsh-syntax-highlighting](https://github.com/zsh-users/zsh-syntax-highlighting)

1. 克隆仓库到`$ZSH_CUSTOM/plugins` (默认 `~/.oh-my-zsh/custom/plugins`)

   ```
   git clone https://github.com/zsh-users/zsh-syntax-highlighting.git ${ZSH_CUSTOM:-~/.oh-my-zsh/custom}/plugins/zsh-syntax-highlighting
   ```

2. 添加到配置文件 `~/.zshrc`):

   ```
   plugins=( [plugins...] zsh-syntax-highlighting)
   ```

### 设置代理

```
# 开启终端代理
alias proxy="
    export http_proxy=http://127.0.0.1:10809;
    export https_proxy=http://127.0.0.1:10809;
    export socks_proxy=socks5://127.0.0.1:10808;
  "
# 关闭终端代理
alias unproxy="
    unset http_proxy;
    unset https_proxy;
    unset socks_proxy;"
    
    
# 设置代理
alias pset='networksetup -setwebproxy Wi-Fi 10.168.80.13 10808 && networksetup -setsecurewebproxy Wi-Fi 10.168.80.13 10808 && networksetup -setsocksfirewallproxy Wi-Fi 10.168.80.13 10808'
# 开启 wifi 代理
alias psystemon='networksetup -setwebproxystate Wi-Fi on && networksetup -setsecurewebproxystate Wi-Fi on && networksetup -setsocksfirewallproxystate Wi-Fi on'
# 关闭 wifi 代理
alias psystemoff='networksetup -setwebproxystate Wi-Fi off && networksetup -setsecurewebproxystate Wi-Fi off && networksetup -setsocksfirewallproxystate Wi-Fi off'

```

