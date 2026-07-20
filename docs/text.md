> ## Documentation Index
> Fetch the complete documentation index at: https://wiki.agnes-ai.com/llms.txt
> Use this file to discover all available pages before exploring further.

# Agnes 2.0 Flash

> 面向智能体工作流、工具调用、编码和图像理解的快速高效语言模型。

<Info>
  Agnes 2.0 Flash 是由 Sapiens AI 开发的快速高效语言模型，适合智能体工作流、工具调用、编码、多轮对话、推理和图像理解等高频生产场景。
</Info>

<CardGroup cols={2}>
  <Card title="模型名称" icon="cube">
    `agnes-2.0-flash`
  </Card>

  <Card title="API Endpoint" icon="link">
    `POST /v1/chat/completions`
  </Card>

  <Card title="上下文窗口" icon="file-lines">
    `512K`
  </Card>

  <Card title="当前价格" icon="tag">
    输入 / 输出 Token 当前均为 `$0 / 1M tokens`
  </Card>
</CardGroup>

## 概述

Agnes 2.0 Flash 针对快速、可靠、高性价比的语言生成、智能体任务执行和图像理解进行了优化。

该模型在 Claw-Eval 基准测试中表现出色，在通用排行榜上以 **Pass^3 得分 60.9%** 排名 **第 9**，展现了较强的自主智能体能力。

## 核心能力

<CardGroup cols={2}>
  <Card title="聊天补全" icon="message">
    为对话、应用和业务系统生成高质量响应。
  </Card>

  <Card title="多轮对话" icon="comments">
    在连续交互中保持上下文一致性。
  </Card>

  <Card title="图像 URL 输入" icon="link">
    支持通过公开可访问的图像 URL 输入视觉内容。
  </Card>

  <Card title="图像理解" icon="eye">
    可用于截图分析、图像描述、视觉问答和信息提取。
  </Card>

  <Card title="工具调用" icon="wrench">
    支持函数调用和外部工具编排。
  </Card>

  <Card title="智能体工作流" icon="robot">
    适合规划、执行和多步骤任务完成。
  </Card>

  <Card title="编码任务" icon="code">
    支持代码生成、调试、解释和重构。
  </Card>

  <Card title="流式输出" icon="bolt">
    支持实时返回响应，提升交互体验。
  </Card>
</CardGroup>

## 适用场景

<CardGroup cols={2}>
  <Card title="AI 助手" icon="robot">
    通用问答、效率助手、个人助理和应用内 Copilot。
  </Card>

  <Card title="自主智能体" icon="diagram-project">
    多步骤任务执行、规划、工具使用和工作流调度。
  </Card>

  <Card title="编码助手" icon="laptop-code">
    代码生成、Bug 排查、重构建议和代码解释。
  </Card>

  <Card title="客户支持" icon="headset">
    FAQ 自动回复、客服机器人和服务自动化。
  </Card>

  <Card title="搜索与问答" icon="magnifying-glass">
    基于检索的问答、摘要生成和信息提取。
  </Card>

  <Card title="图像理解" icon="image">
    截图分析、图片描述、视觉问答和结构化提取。
  </Card>
</CardGroup>

## API Reference

### Endpoint

```text theme={null}
POST https://apihub.agnes-ai.com/v1/chat/completions
```

### 请求头

```bash theme={null}
-H "Authorization: Bearer YOUR_API_KEY"
-H "Content-Type: application/json"
```

### 请求参数

| 参数                     | 类型              | 必填 | 说明                                          |
| ---------------------- | --------------- | -- | ------------------------------------------- |
| `model`                | string          | 是  | 模型名称，使用 `agnes-2.0-flash`。                  |
| `messages`             | array           | 是  | 对话消息数组，包含 `system`、`user` 和 `assistant` 消息。 |
| `messages[].content`   | string / array  | 是  | 可为纯文本，也可为包含 `text` 和 `image_url` 的内容块数组。    |
| `temperature`          | number          | 否  | 控制输出随机性。值越低，结果越确定。                          |
| `top_p`                | number          | 否  | 控制核采样。值越低，输出越聚焦。                            |
| `max_tokens`           | number          | 否  | 响应中生成的最大 token 数量。                          |
| `stream`               | boolean         | 否  | 是否启用流式输出。                                   |
| `tools`                | array           | 否  | 工具调用工作流的工具定义。                               |
| `tool_choice`          | string / object | 否  | 控制模型是否使用工具以及如何使用工具。                         |
| `chat_template_kwargs` | object          | 否  | OpenAI 兼容请求中启用 Thinking 等扩展能力。              |
| `thinking`             | object          | 否  | Anthropic 兼容请求中启用 Thinking 模式。              |

## 图像 URL 输入

Agnes 2.0 Flash 支持在同一个 `messages` 请求中同时传入文本和图像 URL。

| 输入类型   | 格式          | 说明                     |
| ------ | ----------- | ---------------------- |
| 文本     | `text`      | 纯文本指令或问题。              |
| 图像 URL | `image_url` | 通过公开可访问的图像 URL 传递图像内容。 |

```json theme={null}
{
  "role": "user",
  "content": [
    {
      "type": "text",
      "text": "Describe the content of this image."
    },
    {
      "type": "image_url",
      "image_url": {
        "url": "https://example.com/image.jpg"
      }
    }
  ]
}
```

## 请求示例

<Tabs>
  <Tab title="基础聊天">
    ```bash theme={null}
    curl https://apihub.agnes-ai.com/v1/chat/completions \
      -H "Authorization: Bearer YOUR_API_KEY" \
      -H "Content-Type: application/json" \
      -d '{
        "model": "agnes-2.0-flash",
        "messages": [
          {
            "role": "system",
            "content": "You are a helpful AI assistant."
          },
          {
            "role": "user",
            "content": "Explain how autonomous agents use tools to complete tasks."
          }
        ],
        "temperature": 0.7,
        "max_tokens": 1024
      }'
    ```
  </Tab>

  <Tab title="流式输出">
    ```bash theme={null}
    curl https://apihub.agnes-ai.com/v1/chat/completions \
      -H "Authorization: Bearer YOUR_API_KEY" \
      -H "Content-Type: application/json" \
      -d '{
        "model": "agnes-2.0-flash",
        "messages": [
          {
            "role": "user",
            "content": "Write a short product introduction for an AI assistant app."
          }
        ],
        "stream": true
      }'
    ```
  </Tab>

  <Tab title="工具调用">
    ```bash theme={null}
    curl https://apihub.agnes-ai.com/v1/chat/completions \
      -H "Authorization: Bearer YOUR_API_KEY" \
      -H "Content-Type: application/json" \
      -d '{
        "model": "agnes-2.0-flash",
        "messages": [
          {
            "role": "user",
            "content": "What is the weather like in Singapore today?"
          }
        ],
        "tools": [
          {
            "type": "function",
            "function": {
              "name": "get_weather",
              "description": "Get the current weather for a location",
              "parameters": {
                "type": "object",
                "properties": {
                  "location": {
                    "type": "string",
                    "description": "The city and country"
                  }
                },
                "required": ["location"]
              }
            }
          }
        ]
      }'
    ```
  </Tab>

  <Tab title="图像理解">
    ```bash theme={null}
    curl https://apihub.agnes-ai.com/v1/chat/completions \
      -H "Authorization: Bearer YOUR_API_KEY" \
      -H "Content-Type: application/json" \
      -d '{
        "model": "agnes-2.0-flash",
        "messages": [
          {
            "role": "user",
            "content": [
              {
                "type": "text",
                "text": "Describe the content of this image."
              },
              {
                "type": "image_url",
                "image_url": {
                  "url": "https://example.com/image.jpg"
                }
              }
            ]
          }
        ]
      }'
    ```
  </Tab>
</Tabs>

## 响应格式

```json theme={null}
{
  "id": "chatcmpl_xxx",
  "object": "chat.completion",
  "created": 1774432125,
  "model": "agnes-2.0-flash",
  "choices": [
    {
      "index": 0,
      "message": {
        "role": "assistant",
        "content": "Autonomous agents use tools by understanding the user's goal, breaking it into steps, selecting the right tools, executing actions, and using the results to complete the task."
      },
      "finish_reason": "stop"
    }
  ],
  "usage": {
    "prompt_tokens": 35,
    "completion_tokens": 58,
    "total_tokens": 93
  }
}
```

### 响应字段

| 字段                          | 类型      | 说明                          |
| --------------------------- | ------- | --------------------------- |
| `id`                        | string  | 补全请求的唯一 ID。                 |
| `object`                    | string  | 对象类型，通常为 `chat.completion`。 |
| `created`                   | integer | 请求时间戳。                      |
| `model`                     | string  | 请求使用的模型。                    |
| `choices`                   | array   | 生成结果列表。                     |
| `choices[].message.role`    | string  | 消息发送者角色。                    |
| `choices[].message.content` | string  | 模型生成内容。                     |
| `choices[].finish_reason`   | string  | 生成停止原因。                     |
| `usage`                     | object  | Token 使用信息。                 |

## Thinking 模式

对于编码、调试、推理和智能体工作流，可以启用 Thinking 模式以提升任务分解和问题解决能力。

<Tabs>
  <Tab title="OpenAI 兼容格式">
    ```json theme={null}
    {
      "model": "agnes-2.0-flash",
      "messages": [
        {
          "role": "user",
          "content": "Help me write a Python script to process a CSV file."
        }
      ],
      "chat_template_kwargs": {
        "enable_thinking": true
      }
    }
    ```
  </Tab>

  <Tab title="Anthropic 兼容格式">
    ```json theme={null}
    {
      "model": "agnes-2.0-flash",
      "messages": [
        {
          "role": "user",
          "content": "Help me refactor this TypeScript function and explain the changes."
        }
      ],
      "thinking": {
        "type": "enabled",
        "budget_tokens": 2048
      }
    }
    ```
  </Tab>
</Tabs>

<Tip>
  常规编码任务建议从 `budget_tokens: 2048` 开始；复杂调试、重构或多步骤智能体任务可适当提高预算。
</Tip>

## 最佳实践

<AccordionGroup>
  <Accordion title="提示词结构">
    ```text theme={null}
    [角色] + [任务] + [上下文] + [要求] + [输出格式]
    ```
  </Accordion>

  <Accordion title="产品文案生成">
    ```text theme={null}
    You are a product marketing expert. Write a concise App Store description for an AI assistant app. The tone should be clear, professional, and user-friendly.
    ```
  </Accordion>

  <Accordion title="编码任务">
    ```text theme={null}
    Help me debug this React component. The issue is that the button state does not update after clicking. Explain the cause and provide the corrected code.
    ```
  </Accordion>

  <Accordion title="智能体工作流">
    ```text theme={null}
    You are an autonomous research agent. Search for relevant information, summarize the key findings, and return the result in a structured format with source links.
    ```
  </Accordion>

  <Accordion title="图像理解任务">
    ```text theme={null}
    Analyze this screenshot. Identify the main UI elements, explain the possible issue, and provide suggestions to improve the user experience.
    ```
  </Accordion>
</AccordionGroup>

## 限制与价格

| 项目    | 数值      |
| ----- | ------- |
| 上下文窗口 | `512K`  |
| 最大输出  | `65.5K` |

| 类型       | 标准价格                | 当前价格             |
| -------- | ------------------- | ---------------- |
| 输入 Token | `$0.03 / 1M tokens` | `$0 / 1M tokens` |
| 输出 Token | `$0.15 / 1M tokens` | `$0 / 1M tokens` |

## 接入检查清单

<Check>
  使用 `agnes-2.0-flash` 作为模型名称。
</Check>

<Check>
  基础聊天补全请求必须包含 `model` 和 `messages`。
</Check>

<Check>
  图像输入需要使用公开可访问的 `image_url`。
</Check>

<Check>
  流式响应请将 `stream` 设置为 `true`。
</Check>

<Check>
  工具调用工作流请提供 `tools`，并可选提供 `tool_choice`。
</Check>
