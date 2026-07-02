import { Card } from "../../components/Card";

/** 账户占位：个人信息 / 语言切换骨架，留待后续迭代。 */
export function AccountView() {
  return (
    <div className="space-y-4 p-4">
      <Card className="p-4">
        <p className="font-mono text-label-sm text-on-surface-variant">身份</p>
        <p className="mt-2 text-headline-md text-ink">旅行者_01</p>
        <p className="mono text-label-sm text-on-surface-variant">访客 · 未登录</p>
      </Card>

      <Card className="p-4">
        <p className="font-mono text-label-sm text-on-surface-variant">偏好设置</p>
        <div className="mt-3 flex items-center justify-between text-body-md text-ink">
          <span>界面语言</span>
          <span className="mono text-label-sm text-on-surface-variant">中文（后续支持英文）</span>
        </div>
      </Card>

      <p className="text-center font-mono text-label-sm text-on-surface-variant">
        账户体系与行程持久化为后续迭代项
      </p>
    </div>
  );
}
