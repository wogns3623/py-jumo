import { useCreateWaiting } from "@/hooks/useWaiting";
import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { toast } from "@/components/ui/sonner";
import { Loader2, Clock, Users } from "lucide-react";

export const Route = createFileRoute("/waitings/")({
  component: WaitingPage,
});

function WaitingPage() {
  const createWaiting = useCreateWaiting();
  const [formData, setFormData] = useState({
    name: "",
    phone: "",
  });
  const [errors, setErrors] = useState({
    name: "",
    phone: "",
  });

  const validateForm = () => {
    const newErrors = { name: "", phone: "" };
    let isValid = true;

    if (!formData.name.trim()) {
      newErrors.name = "이름을 입력해주세요.";
      isValid = false;
    } else if (formData.name.trim().length < 2) {
      newErrors.name = "이름은 최소 2글자 이상이어야 합니다.";
      isValid = false;
    }

    if (!formData.phone.trim()) {
      newErrors.phone = "전화번호를 입력해주세요.";
      isValid = false;
    } else {
      // 숫자만 추출해서 검증
      const numbersOnly = formData.phone.replace(/[^0-9]/g, "");
      if (numbersOnly.length !== 11) {
        newErrors.phone = "전화번호는 11자리 숫자여야 합니다.";
        isValid = false;
      } else if (!numbersOnly.startsWith("01")) {
        newErrors.phone = "올바른 휴대폰 번호를 입력해주세요. (01X로 시작)";
        isValid = false;
      }
    }

    setErrors(newErrors);
    return isValid;
  };

  const handleInputChange =
    (field: keyof typeof formData) =>
    (e: React.ChangeEvent<HTMLInputElement>) => {
      let value = e.target.value;

      // 전화번호 필드인 경우 숫자만 허용
      if (field === "phone") {
        // 숫자만 추출
        const numbersOnly = value.replace(/[^0-9]/g, "");

        // 11자리 제한
        if (numbersOnly.length > 11) {
          return;
        }

        value = numbersOnly;
      }

      setFormData((prev) => ({
        ...prev,
        [field]: value,
      }));

      // 입력 시 해당 필드의 에러 메시지 제거
      if (errors[field]) {
        setErrors((prev) => ({
          ...prev,
          [field]: "",
        }));
      }
    };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    // 서버에 보낼 데이터 (이미 숫자만 저장되어 있음)
    createWaiting.mutate(formData, {
      onSuccess: () => {
        toast.success("웨이팅 등록 완료! 🎉", {
          description:
            "고객님의 대기 등록이 성공적으로 완료되었습니다. 순서가 되면 연락드리겠습니다.",
        });
        setFormData({ name: "", phone: "" });
        setErrors({ name: "", phone: "" });
      },
      onError: (error) => {
        toast.error("등록에 실패했습니다 😞", {
          description:
            "일시적인 오류가 발생했습니다. 잠시 후 다시 시도해주세요.",
        });
        console.error("Error creating waiting:", error);
      },
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#F3EFE7] to-[#E8DDD4] flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-6">
        {/* 헤더 */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-white rounded-full shadow-lg mb-4">
            <Clock className="w-8 h-8 text-amber-600" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900">웨이팅 등록</h1>
          <p className="text-gray-600">
            대기 순서에 등록하시려면 정보를 입력해주세요
          </p>
        </div>

        {/* 폼 카드 */}
        <Card className="shadow-xl border-0 bg-white/80 backdrop-blur-sm">
          <CardHeader className="text-center pb-6">
            <CardTitle className="text-xl font-semibold text-gray-800">
              고객 정보 입력
            </CardTitle>
            <CardDescription className="text-gray-600">
              정확한 정보를 입력하시면 순서가 되었을 때 연락드리겠습니다
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="name" className="text-gray-700 font-medium">
                  이름
                </Label>
                <Input
                  id="name"
                  placeholder="홍길동"
                  value={formData.name}
                  onChange={handleInputChange("name")}
                  className="h-12 border-gray-200 focus:border-amber-500 focus:ring-amber-500 rounded-lg"
                />
                <p className="text-sm text-gray-500">실명을 입력해주세요</p>
                {errors.name && (
                  <p className="text-sm text-red-500 font-medium">
                    {errors.name}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone" className="text-gray-700 font-medium">
                  전화번호
                </Label>
                <Input
                  id="phone"
                  type="tel"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  placeholder="01012345678"
                  value={formData.phone}
                  onChange={handleInputChange("phone")}
                  className="h-12 border-gray-200 focus:border-amber-500 focus:ring-amber-500 rounded-lg"
                  maxLength={11}
                />
                <p className="text-sm text-gray-500">
                  숫자만 입력하세요 (예: 01012345678)
                </p>
                {errors.phone && (
                  <p className="text-sm text-red-500 font-medium">
                    {errors.phone}
                  </p>
                )}
              </div>

              <Button
                type="submit"
                disabled={createWaiting.isPending}
                className="w-full h-12 bg-amber-600 hover:bg-amber-700 text-white font-semibold rounded-lg transition-colors duration-200 shadow-md hover:shadow-lg"
              >
                {createWaiting.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    등록 중...
                  </>
                ) : (
                  <>
                    <Users className="mr-2 h-4 w-4" />
                    웨이팅 등록하기
                  </>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* 추가 정보 */}
        <div className="text-center space-y-2">
          <p className="text-sm text-gray-500">
            등록 후 대기 순서를 안내드립니다
          </p>
          <div className="flex items-center justify-center space-x-4 text-xs text-gray-400">
            <span>• 순서가 되면 카카오 알림톡으로 알려드려요!</span>
          </div>
        </div>
      </div>
    </div>
  );
}
