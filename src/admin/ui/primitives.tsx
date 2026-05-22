"use client";

import { App, Button, Empty, Flex, Form, Modal, Result, Space, Table, Tag } from "antd";
import type { ButtonProps, FormProps, ModalProps, ResultProps, TableProps, TagProps } from "antd";

export function AdminPageHeader({
  actions,
  backHref,
  description,
  eyebrow,
  title,
}: Readonly<{
  actions?: React.ReactNode;
  backHref?: string;
  description?: React.ReactNode;
  eyebrow?: string;
  title: React.ReactNode;
}>) {
  return (
    <Flex align="flex-start" className="mb-4" gap={16} justify="space-between" wrap>
      <div className="min-w-0">
        {eyebrow ? (
          <div className="mb-1 text-xs font-semibold uppercase text-slate-500">{eyebrow}</div>
        ) : null}
        <Flex align="center" gap={8} wrap>
          {backHref ? (
            <Button href={backHref} size="small" type="text">
              返回
            </Button>
          ) : null}
          <h1 className="m-0 text-2xl font-semibold text-slate-950">{title}</h1>
        </Flex>
        {description ? <div className="mt-2 max-w-3xl text-sm text-slate-500">{description}</div> : null}
      </div>
      {actions ? <Space wrap>{actions}</Space> : null}
    </Flex>
  );
}

export function AdminFilterBar({
  actions,
  children,
  formProps,
}: Readonly<{
  actions?: React.ReactNode;
  children: React.ReactNode;
  formProps?: FormProps;
}>) {
  return (
    <div className="mb-4 rounded-lg border border-slate-200 bg-white p-3">
      <Form layout="vertical" {...formProps}>
        <Flex align="end" gap={12} wrap>
          <div className="grid flex-1 grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4">{children}</div>
          {actions ? <Space wrap>{actions}</Space> : null}
        </Flex>
      </Form>
    </div>
  );
}

export function AdminTable<RecordType extends object>({
  pagination,
  ...props
}: TableProps<RecordType>) {
  return (
    <Table<RecordType>
      bordered={false}
      pagination={pagination ?? { showSizeChanger: true }}
      scroll={{ x: "max-content", ...props.scroll }}
      size="middle"
      {...props}
    />
  );
}

export function AdminFormModal({
  children,
  formProps,
  ...modalProps
}: ModalProps & {
  children: React.ReactNode;
  formProps?: FormProps;
}) {
  return (
    <Modal destroyOnHidden maskClosable={false} {...modalProps}>
      <Form layout="vertical" preserve={false} {...formProps}>
        {children}
      </Form>
    </Modal>
  );
}

export function AdminConfirmModal(props: ModalProps) {
  return <Modal centered destroyOnHidden maskClosable={false} {...props} />;
}

const statusColorMap: Record<string, TagProps["color"]> = {
  active: "green",
  archived: "default",
  blocked: "red",
  cancelled: "red",
  completed: "green",
  delivered: "green",
  failed: "red",
  low_stock: "orange",
  paid: "green",
  pending: "gold",
  pending_manual_review: "gold",
  pending_payment: "gold",
  processing: "blue",
  refunded: "red",
  shipped: "blue",
  suspended: "red",
  wholesale: "purple",
};

export function AdminStatusTag({
  children,
  status,
}: Readonly<{
  children: React.ReactNode;
  status: string;
}>) {
  return <Tag color={statusColorMap[status] ?? "default"}>{children}</Tag>;
}

export function AdminResult({
  actionHref,
  actionLabel,
  status = "info",
  ...props
}: ResultProps & {
  actionHref?: string;
  actionLabel?: string;
}) {
  return (
    <Result
      extra={
        actionHref && actionLabel ? (
          <Button href={actionHref} type="primary">
            {actionLabel}
          </Button>
        ) : props.extra
      }
      status={status}
      {...props}
    />
  );
}

export function AdminEmpty({
  description,
}: Readonly<{
  description: React.ReactNode;
}>) {
  return <Empty description={description} image={Empty.PRESENTED_IMAGE_SIMPLE} />;
}

export function useAdminToast() {
  const { message, notification } = App.useApp();

  return {
    error: (content: string) => message.error(content),
    info: (content: string) => message.info(content),
    notification,
    success: (content: string) => message.success(content),
    warning: (content: string) => message.warning(content),
  };
}

export function AdminButtonLink({
  children,
  href,
  ...props
}: ButtonProps & {
  href: string;
}) {
  return (
    <Button href={href} {...props}>
      {children}
    </Button>
  );
}
