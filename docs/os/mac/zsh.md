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

