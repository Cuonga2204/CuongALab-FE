import { useState } from "react";
import { Card, Avatar, Space, Button } from "antd";
import type { ReplyItem } from "../types/forum.types";

import { useAuthStore } from "src/store/authStore";
import { useCreateReply, useUpvoteReply } from "../hooks/useForum.hook";

import { CKEditor } from "@ckeditor/ckeditor5-react";
import ClassicEditor from "@ckeditor/ckeditor5-build-classic";
import type { Editor } from "@ckeditor/ckeditor5-core";
import {
  hasContent,
  MyUploadAdapterPlugin,
} from "src/utils/ckeditorUploadAdapter";

interface Props {
  reply: ReplyItem;
  topicId: string;
}

export default function ReplyNode({ reply, topicId }: Props) {
  const { user } = useAuthStore();

  const createReply = useCreateReply(topicId);
  const upvoteReply = useUpvoteReply(topicId);

  // 🔹 reply content (HTML)
  const [text, setText] = useState<string>("");

  // 🔹 UI state
  const [openReplyBox, setOpenReplyBox] = useState(false);
  const [showChildren, setShowChildren] = useState(false);

  /* ======================
        SUBMIT REPLY
  ====================== */
  const submitReply = () => {
    if (!hasContent(text)) return;

    createReply.mutate({
      topicId,
      content: text, // ⬅️ HTML (CKEditor)
      userId: String(user?.id),
      parentId: reply.id,
    });

    setText("");
    setOpenReplyBox(false);
    setShowChildren(true);
  };

  return (
    <div style={{ marginLeft: reply.parent_id ? 40 : 0, marginTop: 12 }}>
      <Card
        style={{
          marginBottom: 12,
          borderRadius: 12,
          background: "white",
          border: "1px solid #f0f0f0",
          boxShadow: "0 2px 6px rgba(0,0,0,0.04)",
        }}
      >
        <Space align="start">
          <Avatar src={reply.user_id.avatar}>{reply.user_id.name[0]}</Avatar>

          <div style={{ flex: 1 }}>
            {/* USER NAME */}
            <b>{reply.user_id.name}</b>

            {/* CONTENT (HTML) */}
            <div
              style={{ marginTop: 6 }}
              dangerouslySetInnerHTML={{ __html: reply.content }}
            />

            {/* ACTIONS */}
            <Space size={12} style={{ marginTop: 6 }}>
              {/* Like */}
              <Button
                type="link"
                onClick={() =>
                  upvoteReply.mutate({
                    replyId: reply.id,
                    userId: String(user?.id),
                  })
                }
              >
                👍 {reply.upvotes.length}
              </Button>

              {/* Reply */}
              <Button
                type="link"
                onClick={() => setOpenReplyBox(!openReplyBox)}
              >
                Reply
              </Button>

              {/* Show / Hide children */}
              {reply.replies.length > 0 && (
                <Button
                  type="link"
                  onClick={() => setShowChildren(!showChildren)}
                >
                  {showChildren
                    ? "Hide replies"
                    : `Show ${reply.replies.length} replies`}
                </Button>
              )}
            </Space>

            {/* ======================
                  REPLY EDITOR
            ====================== */}
            {openReplyBox && (
              <div style={{ marginTop: 10 }}>
                <CKEditor
                  editor={ClassicEditor}
                  data={text}
                  config={{
                    extraPlugins: [MyUploadAdapterPlugin],
                  }}
                  onChange={(_: unknown, editor: Editor) => {
                    setText(editor.getData());
                  }}
                />

                <Button
                  type="primary"
                  style={{ marginTop: 8 }}
                  onClick={submitReply}
                >
                  Send
                </Button>
              </div>
            )}

            {/* ======================
                CHILD REPLIES
            ====================== */}
            {showChildren && reply.replies.length > 0 && (
              <div style={{ marginTop: 12, marginLeft: 30 }}>
                {reply.replies.map((child) => (
                  <ReplyNode key={child.id} reply={child} topicId={topicId} />
                ))}
              </div>
            )}
          </div>
        </Space>
      </Card>
    </div>
  );
}
