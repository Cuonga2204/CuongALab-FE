import { useParams, useNavigate } from "react-router-dom";
import { Card, Button, Space, Typography, Avatar, Tag } from "antd";
import { useState } from "react";
import type { Editor } from "@ckeditor/ckeditor5-core";

import { useAuthStore } from "src/store/authStore";
import {
  useGetTopicDetail,
  useUpvoteTopic,
  useCreateReply,
} from "../hooks/useForum.hook";

import ReplyNode from "../components/ReplyNode";
import { useGetCourseDetail } from "src/pages/admin/hooks/course/useCourse.hooks";

import { CKEditor } from "@ckeditor/ckeditor5-react";
import ClassicEditor from "@ckeditor/ckeditor5-build-classic";
import {
  hasContent,
  MyUploadAdapterPlugin,
} from "src/utils/ckeditorUploadAdapter";

const { Title, Text } = Typography;

export default function ForumTopicDetailScreen() {
  const { topicId } = useParams<{ topicId: string }>();
  const navigate = useNavigate();
  const { user } = useAuthStore();

  /* ======================
        LOAD DATA
  ====================== */
  const { data, isLoading } = useGetTopicDetail(topicId || "");

  // extract courseId safely
  const courseId = data?.topic?.course_id || "";
  const { data: course } = useGetCourseDetail(courseId);

  const createReply = useCreateReply(topicId || "");
  const upvoteTopic = useUpvoteTopic(topicId || "");

  /* ======================
        STATE
  ====================== */
  const [text, setText] = useState<string>("");

  if (isLoading || !data) return <div>Loading...</div>;

  const { topic, replies } = data;

  /* ======================
        SUBMIT REPLY
  ====================== */
  const submitReply = () => {
    if (!hasContent(text)) return;

    createReply.mutate({
      topicId: topicId!,
      content: text, // ⬅️ HTML từ CKEditor
      userId: String(user?.id),
      parentId: null,
    });

    setText("");
  };

  return (
    <div
      style={{
        padding: "100px 20px",
        maxWidth: 900,
        margin: "0 auto",
        background: "#f8f9fa",
      }}
    >
      {/* ======================
            BACK
      ====================== */}
      <Button onClick={() => navigate(-1)} style={{ marginBottom: 20 }}>
        ← Back
      </Button>

      {/* ======================
            TOPIC CARD
      ====================== */}
      <Card style={{ borderRadius: 12, marginBottom: 24 }}>
        <Space align="start">
          <Avatar src={topic.user_id.avatar} size={50}>
            {topic.user_id.name[0]}
          </Avatar>

          <div style={{ flex: 1 }}>
            <Title level={3}>{topic.title}</Title>

            {/* COURSE INFO */}
            {course && (
              <Tag color="blue" style={{ marginBottom: 10 }}>
                Khóa học: {course.title} — GV: {course.name_teacher}
              </Tag>
            )}

            {/* CONTENT (HTML) */}
            <div
              style={{
                background: "#fafafa",
                padding: 16,
                marginBottom: 12,
                borderRadius: 8,
              }}
              dangerouslySetInnerHTML={{ __html: topic.content }}
            />

            {/* UPVOTE */}
            <Button
              type="link"
              onClick={() =>
                upvoteTopic.mutate({
                  topicId: topicId!,
                  userId: String(user?.id),
                })
              }
            >
              👍 {topic.upvotes.length}
            </Button>

            <Text type="secondary">Posted by {topic.user_id.name}</Text>
          </div>
        </Space>
      </Card>

      {/* ======================
            REPLIES
      ====================== */}
      <Title level={4}>Replies ({replies.length})</Title>

      {replies.map((reply) => (
        <ReplyNode key={reply.id} reply={reply} topicId={topicId!} />
      ))}

      {/* ======================
            WRITE REPLY
      ====================== */}
      <Card style={{ marginTop: 24, borderRadius: 12 }}>
        <Title level={4}>Write a reply</Title>

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

        <Button type="primary" style={{ marginTop: 12 }} onClick={submitReply}>
          Post Reply
        </Button>
      </Card>
    </div>
  );
}
