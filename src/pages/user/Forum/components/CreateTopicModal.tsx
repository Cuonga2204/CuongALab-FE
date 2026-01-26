import { Modal, Input, Image, Typography } from "antd";
import { useState, type SetStateAction } from "react";
import { CKEditor } from "@ckeditor/ckeditor5-react";
import ClassicEditor from "@ckeditor/ckeditor5-build-classic";

import { useAuthStore } from "src/store/authStore";
import { useCreateTopic } from "src/pages/user/Forum/hooks/useForum.hook";

import type { CreateTopicPayload } from "src/pages/user/Forum/types/forum.types";
import { useGetCourseDetail } from "src/pages/admin/hooks/course/useCourse.hooks";
import { MyUploadAdapterPlugin } from "src/utils/ckeditorUploadAdapter";

const { Text } = Typography;

interface CreateTopicModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
  courseId?: string;
}

export default function CreateTopicModal({
  open,
  onClose,
  onSuccess,
  courseId,
}: CreateTopicModalProps) {
  const { user } = useAuthStore();
  const createTopic = useCreateTopic();

  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [inputCourseId, setInputCourseId] = useState(courseId || "");

  // 👉 fetch course detail theo ID nhập
  const { data: course, isError } = useGetCourseDetail(inputCourseId);

  const handleSubmit = () => {
    if (!title.trim() || !content.trim()) return;

    const payload: CreateTopicPayload = {
      userId: String(user?.id),
      title,
      content,
      course_id: inputCourseId || null,
    };

    createTopic.mutate(payload, {
      onSuccess: () => {
        setTitle("");
        setContent("");
        setInputCourseId(courseId || "");
        onSuccess();
        onClose();
      },
    });
  };

  return (
    <Modal
      title="Create Topic"
      open={open}
      onCancel={onClose}
      onOk={handleSubmit}
      confirmLoading={createTopic.isPending}
      width={720}
    >
      {/* Title */}
      <Input
        placeholder="Topic title"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
      />

      {/* Course ID Input */}
      <Input
        style={{ marginTop: 12 }}
        placeholder="Enter course ID (optional)"
        value={inputCourseId}
        onChange={(e) => setInputCourseId(e.target.value.trim())}
      />

      {/* Course Preview */}
      {course && (
        <div
          style={{
            marginTop: 12,
            display: "flex",
            alignItems: "center",
            gap: 12,
            padding: 8,
            border: "1px solid #eee",
            borderRadius: 6,
          }}
        >
          <Image
            src={course.avatar}
            width={80}
            height={50}
            style={{ objectFit: "cover" }}
            preview={false}
          />
          <div>
            <Text strong>{course.title}</Text>
            <br />
            <Text type="secondary">{course.name_teacher}</Text>
          </div>
        </div>
      )}

      {/* Invalid ID */}
      {inputCourseId && isError && (
        <Text type="danger" style={{ marginTop: 8, display: "block" }}>
          Không tìm thấy khóa học với ID này
        </Text>
      )}

      {/* CKEditor */}
      <div style={{ marginTop: 16 }}>
        <CKEditor
          editor={ClassicEditor}
          data={content}
          config={{
            extraPlugins: [MyUploadAdapterPlugin],
          }}
          onChange={(
            _: unknown,
            editor: { getData: () => SetStateAction<string> }
          ) => {
            setContent(editor.getData());
          }}
        />
      </div>
    </Modal>
  );
}
