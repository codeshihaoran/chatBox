import React, { useState } from "react";
import { Modal, Form, Input, Button, Alert, Typography, Space } from "antd";
import {
  ApiOutlined,
  KeyOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  LoadingOutlined,
} from "@ant-design/icons";
import {
  validateApiKey,
  validateBotId,
  testConnection,
  saveUserConfig,
} from "@/utils/userConfig";
import { setIsLoggedIn } from "@/store/modules/userConfig";
import { useDispatch } from "react-redux";

const { Text } = Typography;

interface UserConfigModalProps {
  visible: boolean;
  onClose: () => void;
}

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

  return (
    <Modal
      title={
        <Space>
          <KeyOutlined />
          <span>配置你的 AI 助手</span>
        </Space>
      }
      open={visible}
      onCancel={handleCancel}
      footer={null}
      width={480}
      centered
      destroyOnClose
      maskClosable
    >
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
    </Modal>
  );
};

export default UserConfigModal;
