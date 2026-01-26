import { useState, useRef } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  Layout,
  Typography,
  Button,
  message,
  Card,
  Space,
  Avatar,
  Input,
  Progress,
  Divider,
} from "antd";

import { useGetLectureDetail } from "src/pages/admin/hooks/course/useLecture.hook";
import { useGetQuizByLecture } from "src/pages/admin/hooks/videoQuiz/useVideoQuiz.hooks";
import LectureDetailSectionList from "src/pages/user/Lecture/component/LectureDetailSectionList";

import { Loader } from "src/components/commons/Loader/Loader";
import { DisplayLoadApi } from "src/components/commons/DisplayLoadApi/DisplayLoadApi";

import {
  useGetLectureProgress,
  useUpdateLectureProgress,
} from "src/pages/user/Lecture/hooks/useLectureProgress.hook";

import { buildCommentTree } from "src/pages/user/Lecture/helpers/buildCommentTree.helper";

import { useAuthStore } from "src/store/authStore";
import { useGetCoursesByUser } from "src/pages/user/MyCourses/hooks/useUserCourses.hooks";

import type {
  VideoQuiz,
  VideoQuizOption,
} from "src/pages/admin/types/videoQuizz.types";
import {
  useAddComment,
  useGetComments,
} from "src/pages/user/Lecture/hooks/useComment.hook";
import type { CommentItem } from "src/pages/user/Lecture/types/comment.types";
import CommentList from "src/pages/user/Lecture/component/comment/CommentList";
import { useGetCourseProgress } from "src/pages/admin/hooks/course/useCourse.hooks";
import { StarOutlined } from "@ant-design/icons";
import ReviewFormUserModal from "src/pages/user/Lecture/component/comment/ReviewFormUserModal";
const { Sider, Content } = Layout;
const { Title, Text } = Typography;
const { TextArea } = Input;

export default function LectureScreen() {
  const { id: courseId, lectureId } = useParams();
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const navigate = useNavigate();
  const { user } = useAuthStore();

  // =========================
  // CHECK USER ENROLLED
  // =========================
  const { data: userCourses = [] } = useGetCoursesByUser(user?.id || "");
  const isEnrolled = userCourses.some((uc) => uc.courseId === courseId);

  // =========================
  // COMMENT HOOKS
  // =========================
  const { data: rawComments = [], refetch } = useGetComments(lectureId || "");
  const addComment = useAddComment(lectureId || "");

  // Build comment tree
  const comments = buildCommentTree(rawComments);

  // =========================
  // LOAD LECTURE + QUIZ
  // =========================
  const { data: lecture, isLoading } = useGetLectureDetail(lectureId || "");
  const { data: quizzes = [] } = useGetQuizByLecture(lectureId || "");

  const { data: progress } = useGetLectureProgress(
    lectureId || "",
    String(user?.id)
  );
  const updateProgress = useUpdateLectureProgress();

  const { data: courseProgress } = useGetCourseProgress(
    courseId || "",
    String(user?.id || "")
  );

  const [currentQuiz, setCurrentQuiz] = useState<VideoQuiz | null>(null);
  const [selectedAnswer, setSelectedAnswer] = useState<VideoQuizOption | null>(
    null
  );
  const [isOpenQuiz, setIsOpenQuiz] = useState(false);
  const lastSentRef = useRef(0);

  const [commentInput, setCommentInput] = useState("");
  const [replyParent, setReplyParent] = useState<string | null>(null);
  const [replyInput, setReplyInput] = useState("");
  const [openReview, setOpenReview] = useState(false);

  const canReview = (courseProgress?.progressPercent || 0) >= 80;

  const streamUrl = `${
    import.meta.env.VITE_API_URL
  }/lecture/stream/${lectureId}`;

  if (isLoading) return <Loader />;
  if (!lecture) return <DisplayLoadApi />;

  // =========================
  // VIDEO PROGRESS LOGIC
  // =========================
  const sendProgress = (current: number) => {
    const duration = Math.floor(videoRef.current?.duration || 1);
    const pct = Math.round((current / duration) * 100);

    updateProgress.mutate({
      user_id: String(user?.id),
      course_id: String(courseId),
      section_id: lecture.section_id,
      lecture_id: lecture.id,
      watched_seconds: current,
      percentage: pct,
    });
  };

  const handleSeeked = () => {
    if (!videoRef.current) return;
    sendProgress(Math.floor(videoRef.current.currentTime));
  };

  const handleTimeUpdate = (e: React.SyntheticEvent<HTMLVideoElement>) => {
    const video = e.currentTarget;
    const current = Math.floor(video.currentTime);

    if (isOpenQuiz) return;

    const foundQuiz = quizzes.find((q) => q.time_in_seconds === current);
    if (foundQuiz) {
      video.pause();
      setCurrentQuiz(foundQuiz);
      setIsOpenQuiz(true);
      return;
    }

    if (current - lastSentRef.current >= 10) {
      lastSentRef.current = current;
      sendProgress(current);
    }
  };

  const handleLoaded = () => {
    if (videoRef.current && progress?.watched_seconds != null) {
      videoRef.current.currentTime = progress.watched_seconds;
    }
  };

  // =========================
  // QUIZ
  // =========================
  const continueVideo = () => {
    if (!videoRef.current || !currentQuiz) return;

    // 👉 Đẩy video qua mốc quiz +1s
    videoRef.current.currentTime = currentQuiz.time_in_seconds + 1;

    videoRef.current.play();
  };
  const submitQuiz = () => {
    if (!currentQuiz || !selectedAnswer) return;

    if (selectedAnswer.is_correct) {
      message.success("Chính xác!");

      continueVideo(); // ⬅️ đẩy time trước
      setIsOpenQuiz(false);
      setCurrentQuiz(null);
      setSelectedAnswer(null);
    } else {
      message.error("Sai rồi!");
    }
  };

  // =========================
  // COMMENT SUBMIT
  // =========================
  const submitComment = () => {
    if (!commentInput.trim()) return;

    addComment.mutate(
      {
        lectureId: lectureId!,
        userId: String(user?.id), // 👈 ADD THIS
        content: commentInput,
        parentId: null,
      },
      {
        onSuccess: () => {
          setCommentInput("");
          refetch();
        },
      }
    );
  };
  const submitReply = (parentId: string) => {
    if (!replyInput.trim()) return;

    addComment.mutate(
      {
        lectureId: lectureId!,
        userId: String(user?.id), // 👈 ADD THIS
        content: replyInput,
        parentId,
      },
      {
        onSuccess: () => {
          setReplyInput("");
          setReplyParent(null);
          refetch();
        },
      }
    );
  };
  // =========================
  // RENDER COMMENT TREE
  // =========================
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const renderComment = (c: CommentItem) => (
    <Card key={c.id} style={{ marginBottom: 12 }}>
      <Space align="start">
        <Avatar>{c.user_id.name[0]}</Avatar>

        <div style={{ flex: 1 }}>
          <Text strong>{c.user_id.name}</Text>
          <div style={{ marginTop: 4 }}>{c.content}</div>

          {isEnrolled && (
            <Button
              type="link"
              size="small"
              onClick={() => setReplyParent(c.id)}
            >
              Reply
            </Button>
          )}

          {/* REPLY INPUT */}
          {replyParent === c.id && (
            <div style={{ marginTop: 8 }}>
              <TextArea
                rows={2}
                value={replyInput}
                onChange={(e) => setReplyInput(e.target.value)}
              />
              <Button
                type="primary"
                size="small"
                style={{ marginTop: 4 }}
                onClick={() => submitReply(c.id)}
              >
                Send Reply
              </Button>
            </div>
          )}

          {/* CHILDREN */}
          {c.replies?.length > 0 && (
            <div style={{ marginTop: 12, marginLeft: 40 }}>
              {c.replies.map((r) => renderComment(r))}
            </div>
          )}
        </div>
      </Space>
    </Card>
  );

  return (
    <Layout>
      <Layout className="mt-16">
        <Content style={{ margin: 20, background: "white", padding: 20 }}>
          {/* VIDEO */}
          <div className="relative h-[70vh]">
            <video
              ref={videoRef}
              src={streamUrl}
              controls
              onLoadedMetadata={handleLoaded}
              onTimeUpdate={handleTimeUpdate}
              onSeeked={handleSeeked}
              style={{
                width: "100%",
                height: "100%",
                objectFit: "cover",
                borderRadius: 8,
              }}
            />

            {/* QUIZ POPUP */}
            {isOpenQuiz && currentQuiz && (
              <div className="absolute inset-0 bg-black/60 flex justify-center items-center z-10">
                <div className="bg-white p-8 rounded-xl w-[80%] max-w-2xl">
                  <h2 className="font-bold mb-6">{currentQuiz.question}</h2>

                  <div className="grid grid-cols-2 gap-4">
                    {currentQuiz.options.map((op, i) => (
                      <div
                        key={op.id}
                        onClick={() => setSelectedAnswer(op)}
                        className={`cursor-pointer px-4 py-3 rounded-lg border ${
                          selectedAnswer?.id === op.id
                            ? "border-blue-500 bg-blue-50"
                            : "border-gray-300"
                        }`}
                      >
                        <span>{String.fromCharCode(65 + i)}.</span> {op.text}
                      </div>
                    ))}
                  </div>

                  <div className="flex justify-center gap-3 mt-8">
                    <Button
                      onClick={() => {
                        setIsOpenQuiz(false);
                        continueVideo();
                      }}
                    >
                      Skip
                    </Button>
                    <Button
                      type="primary"
                      disabled={!selectedAnswer}
                      onClick={submitQuiz}
                    >
                      Confirm
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* TITLE */}
          <Title level={3} className="mt-5">
            {lecture.lecture_title}
          </Title>
          <Button
            type="primary"
            style={{ marginBottom: 20 }}
            onClick={() => navigate(`/forum?courseId=${courseId}`)}
          >
            💬 Discussion
          </Button>

          {/* === COMMENT SECTION === */}
          <div className="mt-10">
            <Title level={4}>Comments</Title>

            {isEnrolled ? (
              <Card style={{ marginBottom: 20 }}>
                <Button
                  type="primary"
                  style={{ marginTop: 10 }}
                  onClick={submitComment}
                >
                  Post Comment
                </Button>
              </Card>
            ) : (
              <Card>You must enroll to comment.</Card>
            )}

            {/* COMMENTS */}
            <CommentList comments={comments} isEnrolled={isEnrolled} />
          </div>
        </Content>

        {/* SIDEBAR */}
        <Sider width={420} style={{ background: "white", paddingTop: 24 }}>
          <div style={{ padding: "0 20px" }}>
            <Title level={5}>Tiến độ khóa học</Title>

            <Progress
              percent={courseProgress?.progressPercent || 0}
              status={
                courseProgress?.progressPercent === 100 ? "success" : "active"
              }
            />

            {/* === REVIEW BUTTON === */}
            <div style={{ marginTop: 8, width: "50%" }}>
              <Button
                type="primary"
                icon={<StarOutlined />}
                block
                disabled={!canReview}
                onClick={() => setOpenReview(true)}
              >
                Form review
              </Button>

              {!canReview && (
                <Text type="secondary" style={{ fontSize: 12 }}>
                  Hoàn thành ít nhất 80% để đánh giá
                </Text>
              )}
            </div>

            <Divider />
          </div>

          <div style={{ height: "calc(100vh - 220px)", overflow: "auto" }}>
            <LectureDetailSectionList
              isEnrolled={isEnrolled}
              courseId={courseId!}
            />
          </div>
        </Sider>
      </Layout>
      <ReviewFormUserModal
        open={openReview}
        courseId={courseId!}
        userId={String(user?.id)}
        onClose={() => setOpenReview(false)}
        onSuccess={() => setOpenReview(false)}
      />
    </Layout>
  );
}
