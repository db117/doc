---
title: ollama 相关
---

> [ollama/ollama: Get up and running with Llama 3.1, Mistral, Gemma 2, and other large language models. (github.com)](https://github.com/ollama/ollama/tree/main)
>
> [Ollama](https://ollama.com/)
>
> 主要就是运行本地模型

## 使用 `HuggingFace` 模型

`ollama`内置模型数量太少，可以导入`GGUF`类型的模型。

创建一个文件，名称随意。比如`config.txt`

修改第一行为本地的模型文件位置

```
FROM "C:\Users\db117\.cache\lm-studio\models\second-state\gte-Qwen2-1.5B-instruct-GGUF\gte-Qwen2-1.5B-instruct-Q5_K_M.gguf"

TEMPLATE """{{- if .System }}
<|im_start|>system {{ .System }}<|im_end|>
{{- end }}
<|im_start|>user
{{ .Prompt }}<|im_end|>
<|im_start|>assistant
"""

SYSTEM """"""

PARAMETER stop <|im_start|>
PARAMETER stop <|im_end|>
```

执行命令即可

```
ollama create llama3-cn -f ./config.txt
```

