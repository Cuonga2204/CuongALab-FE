import {
  BulbOutlined,
  ClockCircleOutlined,
  ReadOutlined,
  UserOutlined,
  VideoCameraOutlined,
} from "@ant-design/icons";
import { Button, Rate } from "antd";
import { useParams } from "react-router-dom";
import { IMAGES } from "src/assets/images";
import { Loader } from "src/components/commons/Loader/Loader";
import { useGetCourseDetail } from "src/pages/admin/hooks/course/useCourse.hooks";
import SectionList from "src/pages/user/CourseDetail/component/SectionList";
import { usePaymentCourse } from "src/pages/user/CourseDetail/hooks/usePaymentCourse..hooks";
import { useGetCoursesByUser } from "src/pages/user/MyCourses/hooks/useUserCourses.hooks";
import { useAuthStore } from "src/store/authStore";

export default function CourseDetail() {
  const { id } = useParams();
  const { user } = useAuthStore();
  const { data: course, isLoading } = useGetCourseDetail(id || "");

  const { data: userCourses = [] } = useGetCoursesByUser(user?.id || "");

  const isEnrolled = userCourses.some(
    (userCourse) => userCourse.courseId === id
  );

  const paymentCourseMutation = usePaymentCourse();

  const handleBuyCourse = () => {
    if (!course || !user) return;

    paymentCourseMutation.mutate({
      userId: user.id,
      courseId: course.id,
      price: course.price_current,
    });
  };

  if (isLoading) return <Loader />;

  return (
    <div className="bg-[#f8f9fa] min-h-screen relative">
      {/* === Banner section === */}
      <div className="relative w-full h-[400px]">
        <img
          className="absolute w-full h-full object-cover"
          src={IMAGES.backgroundDetail}
          alt=""
        />
      </div>

      <div className="absolute z-10 w-6xl left-1/2 -translate-x-1/2 p-5 py-20 top-14 flex justify-between">
        <div className="max-w-6xl flex flex-col gap-3">
          <p className="text-sm text-gray-400">
            Development &gt; Web Devel opment &gt; React
          </p>

          <h1 className="text-3xl font-bold">{course?.title}</h1>

          <p className="text-lg mt-2 max-w-3xl">{course?.overview}</p>

          <div className="flex items-center gap-3 mt-3">
            <span>rating :</span>
            <span className="text-yellow-400 font-bold text-lg">
              {course?.rating_average}
            </span>
            <Rate disabled defaultValue={4} />
            <span className="text-gray-300 text-sm">
              ({course?.student_count.toLocaleString()} students)
            </span>
          </div>

          <p className="text-sm mt-2">
            Teacher : <span>{course?.name_teacher}</span>
          </p>
          <p className="text-sm text-gray-400">
            Last updated 12/2024 • English [Auto]
          </p>
        </div>
      </div>

      {/* === Content section === */}
      <div className="max-w-6xl mx-auto grid grid-cols-3 gap-6 px-4 py-20">
        {/* === Left column === */}
        <div className="col-span-2 space-y-6">
          {/* --- Course Overview --- */}
          <div className="bg-white shadow-md rounded-lg p-6">
            <h2 className="text-xl font-bold mb-4 text-primary">
              Tổng quan khóa học
            </h2>
            <p className="mb-3 text-gray-700">{course?.description}</p>

            <ul className="text-gray-700 space-y-2">
              <li className="flex items-center gap-2">
                <ReadOutlined style={{ color: "#3b82f6" }} />
                <span>
                  {course?.total_lectures} bài giảng • {course?.total_hours} giờ
                  học
                </span>
              </li>
              <li className="flex items-center gap-2">
                <VideoCameraOutlined style={{ color: "#8b5cf6" }} />
                <span>Hình thức học: Qua video</span>
              </li>
              <li className="flex items-center gap-2">
                <BulbOutlined style={{ color: "#facc15" }} />
                <span>Yêu cầu: Kiến thức cơ bản về lập trình</span>
              </li>
            </ul>
          </div>

          {/* --- Course Sections & Lectures --- */}
          {course && (
            <SectionList isEnrolled={isEnrolled} courseId={course.id} />
          )}
        </div>

        {/* === Right sidebar === */}
        <div className="bg-white shadow-lg rounded-lg p-4 h-fit sticky top-20">
          <img
            src={course?.avatar || IMAGES.courseItem}
            alt={course?.title}
            className="rounded-md mb-4"
          />
          <p className="text-2xl font-bold text-primary">
            ₫{course?.price_current?.toLocaleString()}
          </p>
          <p className="line-through text-gray-400 text-sm">1.000.000₫</p>
          {!isEnrolled && (
            <Button
              type="primary"
              className="w-full mt-4 bg-blue-600 hover:bg-blue-700 text-white font-semibold"
              onClick={() => handleBuyCourse()}
            >
              Đăng Ký Học
            </Button>
          )}

          <div className="mt-4 text-sm text-gray-700 space-y-1">
            <p className="flex items-center gap-2">
              <VideoCameraOutlined style={{ color: "#8b5cf6" }} />
              <span>Hình thức học: Qua video</span>
            </p>
            <p className="flex items-center gap-2">
              <ClockCircleOutlined style={{ color: "#8b5cf6" }} />
              Giờ học: {course?.total_hours} giờ
            </p>
            <p className="flex items-center gap-2">
              <ReadOutlined style={{ color: "#f97316" }} />
              {"12 "}
              bài giảng
            </p>
            <p className="flex items-center gap-2">
              <UserOutlined style={{ color: "#16a34a" }} />
              Giảng viên: {course?.name_teacher}
            </p>
            <p className="flex items-center gap-2">ID Course: {course?.id}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
