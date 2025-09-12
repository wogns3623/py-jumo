import { cn } from "@/lib/utils";
import { useEffect, useRef, useState } from "react";

interface MenuImageProps {
  src: string;
  alt: string;
  className?: string;
  bgColor?: string;
  useEdgeBackground?: boolean;
  objectFit?: "contain" | "cover";
}

// Canvas API를 사용한 동적 색상 추출 컴포넌트
// maybe use https://perso.crans.org/frenoy/matlab2012/seamcarving.pdf?
export function MenuImage({
  src,
  alt,
  className,
  bgColor, // 동적 배경 사용 여부
  useEdgeBackground = true, // 가장자리 기반 배경 사용 여부
  objectFit = "contain",
}: MenuImageProps) {
  const [backgroundImage, setBackgroundImage] = useState<string | null>(null);
  const [dominantColor, setDominantColor] = useState<string>("#d1d5db");
  const imgRef = useRef<HTMLImageElement>(null);

  useEffect(() => {
    const createEdgeBackground = () => {
      const img = imgRef.current;
      if (!img || !img.complete) return;

      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      try {
        // 원본 이미지를 캔버스에 그리기
        canvas.width = img.naturalWidth;
        canvas.height = img.naturalHeight;
        ctx.drawImage(img, 0, 0);

        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const pixels = imageData.data;

        // 배경용 캔버스 생성 (컨테이너 크기에 맞춤)
        const bgCanvas = document.createElement("canvas");
        const bgCtx = bgCanvas.getContext("2d");
        if (!bgCtx) return;

        // 배경 캔버스 크기 설정 (약간 큰 크기로)
        bgCanvas.width = 400;
        bgCanvas.height = 120;

        // 좌측 가장자리 한 줄 추출 (x=0)
        const leftEdgeData = new Uint8ClampedArray(canvas.height * 4);
        for (let y = 0; y < canvas.height; y++) {
          const srcIdx = (y * canvas.width + 0) * 4;
          const dstIdx = y * 4;
          leftEdgeData[dstIdx] = pixels[srcIdx]; // R
          leftEdgeData[dstIdx + 1] = pixels[srcIdx + 1]; // G
          leftEdgeData[dstIdx + 2] = pixels[srcIdx + 2]; // B
          leftEdgeData[dstIdx + 3] = pixels[srcIdx + 3]; // A
        }

        // 우측 가장자리 한 줄 추출 (x=width-1)
        const rightEdgeData = new Uint8ClampedArray(canvas.height * 4);
        for (let y = 0; y < canvas.height; y++) {
          const srcIdx = (y * canvas.width + (canvas.width - 1)) * 4;
          const dstIdx = y * 4;
          rightEdgeData[dstIdx] = pixels[srcIdx]; // R
          rightEdgeData[dstIdx + 1] = pixels[srcIdx + 1]; // G
          rightEdgeData[dstIdx + 2] = pixels[srcIdx + 2]; // B
          rightEdgeData[dstIdx + 3] = pixels[srcIdx + 3]; // A
        }

        // 배경에 가장자리 픽셀들을 확장해서 그리기
        const bgImageData = bgCtx.createImageData(
          bgCanvas.width,
          bgCanvas.height,
        );
        const bgPixels = bgImageData.data;

        for (let y = 0; y < bgCanvas.height; y++) {
          for (let x = 0; x < bgCanvas.width; x++) {
            const bgIdx = (y * bgCanvas.width + x) * 4;

            // 원본 이미지의 높이에 맞춰 y 좌표 매핑
            const mappedY = Math.floor((y / bgCanvas.height) * canvas.height);

            // 좌측에서 우측으로 50% 기준으로 배치
            const ratio = x / bgCanvas.width;

            if (ratio < 0.5) {
              // 왼쪽 50% - 좌측 가장자리 색상
              const srcIdx = mappedY * 4;
              bgPixels[bgIdx] = leftEdgeData[srcIdx];
              bgPixels[bgIdx + 1] = leftEdgeData[srcIdx + 1];
              bgPixels[bgIdx + 2] = leftEdgeData[srcIdx + 2];
              bgPixels[bgIdx + 3] = 255;
            } else {
              // 오른쪽 50% - 우측 가장자리 색상
              const srcIdx = mappedY * 4;
              bgPixels[bgIdx] = rightEdgeData[srcIdx];
              bgPixels[bgIdx + 1] = rightEdgeData[srcIdx + 1];
              bgPixels[bgIdx + 2] = rightEdgeData[srcIdx + 2];
              bgPixels[bgIdx + 3] = 255;
            }
          }
        }

        // 배경 이미지 데이터를 캔버스에 적용
        bgCtx.putImageData(bgImageData, 0, 0);

        // Data URL로 변환하여 상태에 저장
        setBackgroundImage(bgCanvas.toDataURL());

        // RGB를 HSL로 변환하는 함수 (개선된 버전)
        const rgbToHsl = (
          r: number,
          g: number,
          b: number,
        ): [number, number, number] => {
          r /= 255;
          g /= 255;
          b /= 255;

          const max = Math.max(r, g, b);
          const min = Math.min(r, g, b);
          const diff = max - min;

          let h = 0;
          let s = 0;
          const l = (max + min) / 2;

          if (diff !== 0) {
            s = l > 0.5 ? diff / (2 - max - min) : diff / (max + min);

            switch (max) {
              case r:
                h = ((g - b) / diff + (g < b ? 6 : 0)) / 6;
                break;
              case g:
                h = ((b - r) / diff + 2) / 6;
                break;
              case b:
                h = ((r - g) / diff + 4) / 6;
                break;
            }
          }

          return [h * 360, s * 100, l * 100];
        };

        // 색상을 계열별로 분류하는 함수 (더 세밀한 분류)
        const getColorGroup = (r: number, g: number, b: number): string => {
          // 먼저 무채색 검사 (RGB 값의 차이가 작으면 무채색)
          const maxRgb = Math.max(r, g, b);
          const minRgb = Math.min(r, g, b);
          const rgbDiff = maxRgb - minRgb;

          // RGB 차이가 30 미만이면 무채색으로 분류
          if (rgbDiff < 30) {
            const avg = (r + g + b) / 3;
            if (avg < 80) return "black";
            if (avg > 180) return "white";
            return "gray";
          }

          const [h, s, l] = rgbToHsl(r, g, b);

          // 채도가 매우 낮으면 무채색
          if (s < 15) {
            if (l < 30) return "black";
            if (l > 70) return "white";
            return "gray";
          }

          // 명도가 매우 높거나 낮으면 특별 처리
          if (l > 90) return "white";
          if (l < 10) return "black";

          // 색조 기준으로 색상 계열 분류 (더 정확한 구간)
          if (h >= 345 || h < 15) return "red"; // 빨강: 345-15도
          if (h >= 15 && h < 45) return "orange"; // 주황: 15-45도
          if (h >= 45 && h < 75) return "yellow"; // 노랑: 45-75도
          if (h >= 75 && h < 150) return "green"; // 초록: 75-150도
          if (h >= 150 && h < 210) return "cyan"; // 청록: 150-210도
          if (h >= 210 && h < 270) return "blue"; // 파랑: 210-270도
          if (h >= 270 && h < 315) return "purple"; // 보라: 270-315도
          if (h >= 315 && h < 345) return "magenta"; // 자홍: 315-345도

          return "gray"; // 기본값
        };

        // 색상 계열별 빈도 계산
        const colorGroupFrequency = new Map<string, number>();
        const colorGroupPixels = new Map<
          string,
          Array<[number, number, number]>
        >();

        // 좌우 가장자리에서 색상 수집
        for (let y = 0; y < canvas.height; y++) {
          const leftIdx = (y * canvas.width + 0) * 4;
          const rightIdx = (y * canvas.width + (canvas.width - 1)) * 4;

          // 좌측 픽셀
          const leftR = pixels[leftIdx];
          const leftG = pixels[leftIdx + 1];
          const leftB = pixels[leftIdx + 2];
          const leftGroup = getColorGroup(leftR, leftG, leftB);

          colorGroupFrequency.set(
            leftGroup,
            (colorGroupFrequency.get(leftGroup) || 0) + 1,
          );
          if (!colorGroupPixels.has(leftGroup)) {
            colorGroupPixels.set(leftGroup, []);
          }
          colorGroupPixels.get(leftGroup)!.push([leftR, leftG, leftB]);

          // 우측 픽셀
          const rightR = pixels[rightIdx];
          const rightG = pixels[rightIdx + 1];
          const rightB = pixels[rightIdx + 2];
          const rightGroup = getColorGroup(rightR, rightG, rightB);

          colorGroupFrequency.set(
            rightGroup,
            (colorGroupFrequency.get(rightGroup) || 0) + 1,
          );
          if (!colorGroupPixels.has(rightGroup)) {
            colorGroupPixels.set(rightGroup, []);
          }
          colorGroupPixels.get(rightGroup)!.push([rightR, rightG, rightB]);
        }

        // 색상 계열 다양성 검사 (개선된 버전)
        const sortedColorGroups = Array.from(
          colorGroupFrequency.entries(),
        ).sort((a, b) => b[1] - a[1]);

        // console.log("색상 계열 분석:", sortedColorGroups); // 디버깅용

        let shouldUseSingleColor = false;

        // 색상 계열이 1개만 있으면 생성된 배경 사용
        if (sortedColorGroups.length === 1) {
          shouldUseSingleColor = false;
        }
        // 색상 계열이 2개 이상이면 비율 검사
        else if (sortedColorGroups.length >= 2) {
          const [first, second] = sortedColorGroups;

          // 1위와 2위의 빈도 차이 계산
          const firstSecondRatio = first[1] / Math.max(second[1], 1);

          // 1위가 전체의 80% 이상을 차지하면 생성된 배경 사용
          const totalPixels = Array.from(colorGroupFrequency.values()).reduce(
            (sum, count) => sum + count,
            0,
          );
          const dominanceRatio = first[1] / totalPixels;

          // console.log(
          //   `주요 색상: ${first[0]} (${(dominanceRatio * 100).toFixed(
          //     1
          //   )}%), 2위: ${second[0]} (${(
          //     (second[1] / totalPixels) *
          //     100
          //   ).toFixed(1)}%)`
          // );

          // 조건: 1위가 전체의 70% 미만이거나, 1위와 2위 차이가 2배 미만이면 단일 색상 사용
          if (dominanceRatio < 0.7 || firstSecondRatio < 2) {
            shouldUseSingleColor = true;
          }
        }

        // 가장 빈도가 높은 색상 계열에서 대표 색상 선택
        let mostFrequentColorGroup = "";
        let maxGroupFrequency = 0;

        colorGroupFrequency.forEach((frequency, group) => {
          if (frequency > maxGroupFrequency) {
            maxGroupFrequency = frequency;
            mostFrequentColorGroup = group;
          }
        });

        if (
          mostFrequentColorGroup &&
          colorGroupPixels.has(mostFrequentColorGroup)
        ) {
          // 해당 색상 계열에서 가장 많이 나타나는 실제 RGB 값 찾기
          const groupPixels = colorGroupPixels.get(mostFrequentColorGroup)!;
          const pixelFrequency = new Map<string, number>();

          groupPixels.forEach(([r, g, b]) => {
            const colorKey = `${r},${g},${b}`;
            pixelFrequency.set(
              colorKey,
              (pixelFrequency.get(colorKey) || 0) + 1,
            );
          });

          let mostFrequentPixel = "";
          let maxPixelFrequency = 0;

          pixelFrequency.forEach((frequency, colorKey) => {
            if (frequency > maxPixelFrequency) {
              maxPixelFrequency = frequency;
              mostFrequentPixel = colorKey;
            }
          });

          if (mostFrequentPixel) {
            const [r, g, b] = mostFrequentPixel.split(",").map(Number);
            setDominantColor(`rgb(${r}, ${g}, ${b})`);
          }
        }

        // 색상이 너무 다양하면 배경 이미지를 null로 설정하여 단일 색상 사용
        if (shouldUseSingleColor) {
          setBackgroundImage(null);
        }
      } catch (error) {
        console.warn("가장자리 배경 생성 실패:", error);
        setBackgroundImage(null);
        setDominantColor("#d1d5db");
      }
    };

    const img = imgRef.current;
    if (img) {
      if (img.complete) {
        createEdgeBackground();
      } else {
        img.addEventListener("load", createEdgeBackground);
        return () => img.removeEventListener("load", createEdgeBackground);
      }
    }
  }, [src]);

  return (
    <div
      className={cn(
        "w-full h-full flex items-center justify-center transition-all duration-300",
        className,
      )}
      style={
        useEdgeBackground
          ? {
              // 생성된 배경 이미지 사용
              backgroundImage: backgroundImage
                ? `url(${backgroundImage})`
                : undefined,
              backgroundColor: backgroundImage ? "transparent" : dominantColor,
              backgroundSize: "100% 100%",
              backgroundPosition: "center",
              backgroundRepeat: "no-repeat",
            }
          : {
              // 단일 색상 배경 사용
              backgroundColor: bgColor ?? dominantColor,
            }
      }
    >
      {/* 숨겨진 원본 이미지 (색상 추출용) */}
      <img
        ref={imgRef}
        src={src}
        alt={alt}
        className="hidden"
        crossOrigin="anonymous"
      />

      {/* 실제 표시되는 이미지 */}
      <img
        src={src}
        alt={alt}
        className={`w-full h-full object-${objectFit}`}
      />
    </div>
  );
}
