import { createFileRoute, Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export const Route = createFileRoute("/")({
  component: HomePage,
});

function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-green-100 p-5">
      <div className="max-w-4xl mx-auto">
        <Card className="bg-white/90 backdrop-blur-sm shadow-lg">
          <CardHeader className="text-center pb-8">
            <CardTitle className="text-4xl font-bold text-green-800 mb-4">
              음식점 주문 시스템
            </CardTitle>
            <p className="text-lg text-green-700">
              QR 코드로 간편하게 주문하세요
            </p>
          </CardHeader>

          <CardContent className="text-center">
            <div className="space-y-6">
              <div className="bg-green-50 p-6 rounded-lg">
                <h2 className="text-xl font-semibold text-green-800 mb-2">
                  고객용 메뉴
                </h2>
                <p className="text-green-600 mb-4">
                  테이블의 QR 코드를 스캔해서 메뉴를 확인하고 주문하세요
                </p>
                <Button
                  asChild
                  size="lg"
                  className="bg-green-600 hover:bg-green-700"
                >
                  <Link to="/menus">메뉴 보기 (테스트)</Link>
                </Button>
              </div>

              <div className="bg-blue-50 p-6 rounded-lg">
                <h2 className="text-xl font-semibold text-blue-800 mb-2">
                  관리자 페이지
                </h2>
                <p className="text-blue-600 mb-4">주문 관리 및 메뉴 설정</p>
                <Button
                  asChild
                  variant="outline"
                  size="lg"
                  className="border-blue-600 text-blue-600 hover:bg-blue-50"
                >
                  <Link to="/admin/dashboard">관리자 페이지</Link>
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
