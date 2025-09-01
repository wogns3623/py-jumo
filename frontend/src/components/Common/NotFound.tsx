import { Button } from "@/components/ui/button";
import { Link } from "@tanstack/react-router";

const NotFound = () => {
  return (
    <div
      className="h-screen flex items-center justify-center flex-col p-4"
      data-testid="not-found"
    >
      <div className="flex items-center z-10">
        <div className="flex flex-col ml-4 items-center justify-center p-4">
          <h1 className="text-6xl md:text-8xl font-bold leading-none mb-4">
            404
          </h1>
          <h2 className="text-2xl font-bold mb-2">Oops!</h2>
        </div>
      </div>

      <p className="text-lg text-gray-600 mb-4 text-center z-10">
        페이지를 찾을 수 없습니다.
      </p>

      <div className="z-10">
        <Button asChild>
          <Link to="/">홈으로 돌아가기</Link>
        </Button>
      </div>
    </div>
  );
};

export default NotFound;
