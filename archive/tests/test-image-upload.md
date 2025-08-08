# 测试图片上传功能

这是一个测试文档，用于验证图片上传到Halo的功能。

## 测试图片

下面是一张测试图片：

![image.png](../assets/image_1754625746051_0.png)

另一张SVG图片：

![test-image](../assets/test-image.svg)

## 说明

当这篇文章发布到Halo时，上面的图片应该会：

1. 从Logseq的assets目录读取
2. 上传到Halo服务器
3. 获得新的Halo图片地址
4. 在文章中替换为新地址

## 预期结果

原始链接：
- `![image.png](../assets/image_1754625746051_0.png)`
- `![test-image](../assets/test-image.svg)`

应该被替换为：
- `![image.png](/upload/2024/12/image_1754625746051_0-uuid.png)`
- `![test-image](/upload/2024/12/test-image-uuid.svg)`

**说明：** 现在使用相对地址格式，避免域名变更的影响。

## 调试信息

请查看控制台输出的详细调试信息，包括：
- 图片匹配结果
- 文件读取过程
- 上传进度
- 最终替换结果