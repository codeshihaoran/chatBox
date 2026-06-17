import React, { useState } from "react";
import { Modal, Form, Input, Button, Alert, Typography, Space, Divider, Image } from "antd";
import {
  ApiOutlined,
  KeyOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  LoadingOutlined,
  QuestionCircleOutlined,
  ArrowLeftOutlined,
  LinkOutlined,
  RightCircleOutlined,
} from "@ant-design/icons";
import {
  validateApiKey,
  validateBotId,
  testConnection,
  saveUserConfig,
} from "@/utils/userConfig";
import { setIsLoggedIn } from "@/store/modules/userConfig";
import { useDispatch } from "react-redux";

// ===== 导入配置教程图片 =====
import createKeyImg from "@/assets/coze/createKey.png";
import keyInfoImg from "@/assets/coze/keyInfo.png";
import addProjectImg from "@/assets/coze/addProject.png";
import createBotImg from "@/assets/coze/createBot.png";
import publishImg from "@/assets/coze/publish.png";
import publishInfoImg from "@/assets/coze/publishInfo.png";
import botInfoImg from "@/assets/coze/botInfo.png";

const { Text, Title, Paragraph } = Typography;

interface UserConfigModalProps {
  visible: boolean;
  onClose: () => void;
}

/** 教程步骤数据 */
const GUIDE_STEPS = [
  {
    step: 1,
    title: "创建 Personal Access Token",
    description:
      "访问 Coze 开放平台，在「个人访问令牌」页面点击「创建令牌」，填写令牌名称后生成。复制以 pat_ 开头的密钥并保存到下方表单中。",
    note: "关闭页面后将无法再次查看完整密钥，请立即复制并保存。",
    images: [
      { src: createKeyImg, alt: "创建令牌页面", caption: "点击「创建令牌」" },
      { src: keyInfoImg, alt: "复制密钥", caption: "复制生成的 pat_ 密钥" },
    ],
    link: "https://www.coze.cn/open/oauth/pats",
    linkText: "打开 Coze 开放平台 →",
  },
  {
    step: 2,
    title: "创建 Bot",
    description:
      "在 Coze 平台创建一个你的 AI 机器人。如果你已有项目空间，可直接在项目中创建 Bot；如果没有，可先创建一个项目或使用默认空间。",
    images: [
      { src: addProjectImg, alt: "创建项目", caption: "选择或创建项目空间" },
      { src: createBotImg, alt: "创建Bot", caption: "创建并配置你的 Bot" },
    ],
  },
  {
    step: 3,
    title: "配置智能体",
    description:
      "创建完成后，点击进入你创建的智能体卡片，在智能体配置页面中设置角色提示词、技能等参数，完成智能体的个性化配置。",
    images: [
      { src: botInfoImg, alt: "配置智能体", caption: "配置智能体信息并点击卡片进入" },
    ],
  },
  {
    step: 4,
    title: "发布 Bot",
    description:
      "智能体配置完成后，点击「发布」按钮将其发布到 API。只有发布后的 Bot 才能通过 API 调用，发布时可以选择配置相应的发布渠道。",
    images: [
      { src: publishImg, alt: "发布Bot", caption: "点击发布按钮" },
      { src: publishInfoImg, alt: "发布信息", caption: "确认发布配置" },
    ],
  },
  {
    step: 5,
    title: "获取 Bot ID",
    description:
      "发布成功后，查看当前浏览器地址栏，URL 中 `bot/` 后面的数字即为你的 Bot ID。复制该 ID 粘贴到下方表单的「Bot ID」输入框中。",
    note: "例如 URL 为 https://www.coze.cn/store/bot/7650834423914627124，则 Bot ID 为 7650834423914627124。",
    images: [],
  },
];

/** 用户自定义配置表单组件
 *
 * 用户在此配置自己的 Coze API Key 和 Bot ID，
 * 配置完成后才能正常使用 AI 对话功能。
 */
const UserConfigModal: React.FC<UserConfigModalProps> = ({
  visible,
  onClose,
}) => {
  const dispatch = useDispatch();
  const [form] = Form.useForm();

  // 视图模式：form（配置表单）| guide（配置教程）
  const [viewMode, setViewMode] = useState<"form" | "guide">("form");

  // 测试状态
  const [testStatus, setTestStatus] = useState<
    "idle" | "testing" | "success" | "error"
  >("idle");
  const [testMessage, setTestMessage] = useState("");
  const [isVerified, setIsVerified] = useState(false);

  // 手动验证格式（点击测试按钮时触发）
  const validateFields = (): { apiKey: string; botId: string } | null => {
    const apiKey = form.getFieldValue("apiKey")?.trim() || "";
    const botId = form.getFieldValue("botId")?.trim() || "";

    // 验证 API Key
    const apiKeyResult = validateApiKey(apiKey);
    if (!apiKeyResult.valid) {
      form.setFields([
        { name: "apiKey", errors: [apiKeyResult.error!] },
      ]);
      return null;
    }
    form.setFields([{ name: "apiKey", errors: [] }]);

    // 验证 Bot ID
    const botIdResult = validateBotId(botId);
    if (!botIdResult.valid) {
      form.setFields([
        { name: "botId", errors: [botIdResult.error!] },
      ]);
      return null;
    }
    form.setFields([{ name: "botId", errors: [] }]);

    return { apiKey, botId };
  };

  // 测试连接
  const handleTest = async () => {
    const values = validateFields();
    if (!values) return;

    setTestStatus("testing");
    setTestMessage("");

    const result = await testConnection(values.apiKey, values.botId);

    if (result.success) {
      setTestStatus("success");
      setTestMessage("连接成功！API Key 和 Bot ID 验证通过");
      setIsVerified(true);
    } else {
      setTestStatus("error");
      setTestMessage(result.error || "连接测试失败");
      setIsVerified(false);
    }
  };

  // 保存配置（仅验证通过后可调用）
  const handleSave = () => {
    if (!isVerified) return;

    const values = validateFields();
    if (!values) return;

    // 保存配置到 localStorage
    saveUserConfig({
      apiKey: values.apiKey,
      botId: values.botId,
      isVerified: true,
    });

    // 更新 Redux 登录状态
    dispatch(setIsLoggedIn(true));

    // 关闭弹窗
    resetAndClose();
  };

  // 取消 / 关闭
  const handleCancel = () => {
    // 如果是首次弹出且用户取消，不重置任何状态，只是关闭弹窗
    resetAndClose();
  };

  const resetAndClose = () => {
    setViewMode("form");
    setTestStatus("idle");
    setTestMessage("");
    setIsVerified(false);
    form.resetFields();
    onClose();
  };

  // 表单值变化时重置测试状态
  const handleValuesChange = () => {
    if (testStatus !== "idle") {
      setTestStatus("idle");
      setTestMessage("");
      setIsVerified(false);
    }
  };

  const isTesting = testStatus === "testing";
  const canTest = !isTesting;

  // ==================== 配置表单视图 ====================
  const renderFormView = () => (
    <>
      <div style={{ marginBottom: 20 }}>
        <Text type="secondary">
          请配置你的 Coze API Key 和 Bot ID，配置完成后即可开始与 AI 对话。
          你的配置信息仅存储在本地浏览器中。
        </Text>
      </div>

      <Form
        form={form}
        layout="vertical"
        onValuesChange={handleValuesChange}
        requiredMark="optional"
        initialValues={{ apiKey: "", botId: "" }}
      >
        <Form.Item
          name="apiKey"
          label="API Key"
          extra="Coze 个人访问令牌（Personal Access Token），以 pat_ 开头"
        >
          <Input.Password
            prefix={<KeyOutlined style={{ color: "#888" }} />}
            placeholder="pat_xxxxxxxxxxxxxxxxxxxx"
            size="large"
            autoComplete="off"
            disabled={isTesting}
          />
        </Form.Item>

        <Form.Item
          name="botId"
          label="Bot ID"
          extra="Coze 机器人 ID，可在 Coze 平台 Bot 设置中查看"
        >
          <Input
            prefix={<ApiOutlined style={{ color: "#888" }} />}
            placeholder="7650834423914627124"
            size="large"
            autoComplete="off"
            disabled={isTesting}
          />
        </Form.Item>
      </Form>

      {/* 如何获取帮助入口 */}
      <div
        style={{
          textAlign: "center",
          marginBottom: 16,
        }}
      >
        <Button
          type="link"
          icon={<QuestionCircleOutlined />}
          onClick={() => setViewMode("guide")}
          style={{ fontSize: 14 }}
        >
          如何获取 API Key 与 Bot ID？
        </Button>
      </div>

      {/* 测试结果提示 */}
      {testStatus === "success" && (
        <Alert
          type="success"
          showIcon
          icon={<CheckCircleOutlined />}
          message="连接成功"
          description={testMessage}
          style={{ marginBottom: 16, borderRadius: 8 }}
        />
      )}
      {testStatus === "error" && (
        <Alert
          type="error"
          showIcon
          icon={<CloseCircleOutlined />}
          message="连接失败"
          description={testMessage}
          style={{ marginBottom: 16, borderRadius: 8 }}
        />
      )}

      {/* 操作按钮 */}
      <div
        style={{
          display: "flex",
          justifyContent: "flex-end",
          gap: 12,
          marginTop: 8,
        }}
      >
        <Button onClick={handleCancel} disabled={isTesting}>
          取消
        </Button>
        <Button
          onClick={handleTest}
          disabled={!canTest || isTesting}
          icon={isTesting ? <LoadingOutlined /> : <ApiOutlined />}
        >
          {isTesting ? "测试中..." : "测试连接"}
        </Button>
        <Button
          type="primary"
          onClick={handleSave}
          disabled={!isVerified || isTesting}
          icon={isVerified ? <CheckCircleOutlined /> : undefined}
          style={{
            backgroundColor: isVerified ? "#52c41a" : undefined,
            borderColor: isVerified ? "#52c41a" : undefined,
          }}
        >
          保存并开始使用
        </Button>
      </div>
    </>
  );

  // ==================== 教程指南视图 ====================
  const renderGuideView = () => (
    <div>
      {/* 顶部返回按钮 + 标题 */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          marginBottom: 20,
        }}
      >
        <Button
          type="text"
          icon={<ArrowLeftOutlined />}
          onClick={() => setViewMode("form")}
          style={{ marginRight: 12, fontSize: 16, color: "#1677ff" }}
        >
          返回表单
        </Button>
        <Text strong style={{ fontSize: 18 }}>
          如何获取 API Key 与 Bot ID
        </Text>
      </div>

      <Paragraph type="secondary" style={{ marginBottom: 24, fontSize: 14 }}>
        按照以下步骤完成配置，即可开始使用 AI 对话功能。
      </Paragraph>

      {/* 步骤列表 */}
      <div
        style={{
          maxHeight: "calc(80vh - 180px)",
          overflowY: "auto",
          paddingRight: 8,
        }}
      >
        {GUIDE_STEPS.map((step, index) => (
          <div key={step.step} style={{ marginBottom: index < GUIDE_STEPS.length - 1 ? 28 : 0 }}>
            {/* 步骤卡片 */}
            <div
              style={{
                background: "#141414",
                border: "1px solid #303030",
                borderRadius: 12,
                padding: "20px 24px",
              }}
            >
              {/* 步骤标题行 */}
              <div
                style={{
                  display: "flex",
                  alignItems: "flex-start",
                  gap: 12,
                  marginBottom: 12,
                }}
              >
                <div
                  style={{
                    width: 32,
                    height: 32,
                    borderRadius: "50%",
                    background: "#1677ff",
                    color: "#fff",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontWeight: 600,
                    fontSize: 16,
                    flexShrink: 0,
                  }}
                >
                  {step.step}
                </div>
                <div style={{ flex: 1 }}>
                  <Text strong style={{ fontSize: 16, display: "block", marginBottom: 4 }}>
                    {step.title}
                  </Text>
                  <Paragraph
                    type="secondary"
                    style={{ marginBottom: step.note ? 4 : 0, fontSize: 13, lineHeight: 1.7 }}
                  >
                    {step.description}
                  </Paragraph>
                  {step.note && (
                    <Text
                      type="warning"
                      style={{ fontSize: 12, display: "block", marginBottom: 8 }}
                    >
                      ⚠ {step.note}
                    </Text>
                  )}
                </div>
              </div>

              {/* 外部链接 */}
              {step.link && (
                <div style={{ marginBottom: 12 }}>
                  <a
                    href={step.link}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: 6,
                      color: "#1677ff",
                      fontSize: 13,
                    }}
                  >
                    <LinkOutlined />
                    {step.linkText || step.link}
                  </a>
                </div>
              )}

              {/* 图片网格 */}
              {step.images.length > 0 && (
                <div
                  style={{
                    display: "flex",
                    flexWrap: "wrap",
                    gap: 12,
                    marginTop: 8,
                  }}
                >
                  {step.images.map((img, i) => (
                    <div key={i} style={{ flex: "1 1 240px", minWidth: 200 }}>
                      <Image
                        src={img.src}
                        alt={img.alt}
                        style={{
                          width: "100%",
                          borderRadius: 8,
                          border: "1px solid #333",
                        }}
                        preview={{ mask: "点击预览" }}
                      />
                      <div
                        style={{
                          textAlign: "center",
                          color: "#888",
                          fontSize: 12,
                          marginTop: 6,
                        }}
                      >
                        {img.caption}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* 步骤之间的连接线 */}
            {index < GUIDE_STEPS.length - 1 && (
              <div
                style={{
                  display: "flex",
                  justifyContent: "center",
                  padding: "8px 0",
                  color: "#555",
                }}
              >
                <RightCircleOutlined style={{ fontSize: 20 }} />
              </div>
            )}
          </div>
        ))}
      </div>

      {/* 底部操作区 */}
      <Divider style={{ borderColor: "#303030", margin: "20px 0 16px" }} />
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <Text type="secondary" style={{ fontSize: 13 }}>
          完成以上步骤后，回到表单填写配置信息
        </Text>
        <Button
          type="primary"
          icon={<ArrowLeftOutlined />}
          onClick={() => setViewMode("form")}
        >
          返回表单去配置
        </Button>
      </div>
    </div>
  );

  return (
    <Modal
      title={
        viewMode === "form" ? (
          <Space>
            <KeyOutlined />
            <span>配置你的 AI 助手</span>
          </Space>
        ) : (
          <Space>
            <QuestionCircleOutlined />
            <span>配置教程</span>
          </Space>
        )
      }
      open={visible}
      onCancel={handleCancel}
      footer={null}
      width={viewMode === "guide" ? 720 : 480}
      centered
      destroyOnClose
      maskClosable={false}
    >
      {viewMode === "form" ? renderFormView() : renderGuideView()}
    </Modal>
  );
};

export default UserConfigModal;
