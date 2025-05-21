// frontend/src/components/LoadingSequence.jsx
import React, { useEffect, useState } from 'react';
import usePopulationStore from '../store/populationStore';

const LoadingSequence = () => {
  const { isLoading, initializeStore } = usePopulationStore();
  const [showInitialScreen, setShowInitialScreen] = useState(true);
  const [progress, setProgress] = useState(0);
  
  useEffect(() => {
    // 스토어 초기화
    initializeStore();
    
    // 프로그레스 바 효과
    const timer = setInterval(() => {
      setProgress(prev => {
        if (prev >= 100) {
          clearInterval(timer);
          return 100;
        }
        return prev + 5;
      });
    }, 100);
    
    return () => clearInterval(timer);
  }, [initializeStore]);
  
  useEffect(() => {
    // 초기 로딩이 완료되면 시작 화면 숨기기
    if ((!isLoading && progress >= 100) || progress >= 100) {
      // 최소 표시 시간 보장 (1초로 축소)
      const fadeTimer = setTimeout(() => {
        setShowInitialScreen(false);
      }, 1000); // 500ms에서 1000ms로 변경
      
      return () => clearTimeout(fadeTimer);
    }
  }, [isLoading, progress]);
  
  if (!showInitialScreen) return null;
  
  return (
    <div className="loading-sequence">
      <div className="loading-content">
        <h2>서울시 실시간 인구 핫스팟</h2>
        <div className="loading-animation">
          <div className="pulse-dot"></div>
        </div>
        <div className="loading-progress-bar">
          <div 
            className="loading-progress-fill"
            style={{ width: `${progress}%` }}
          ></div>
        </div>
        <p>데이터를 불러오는 중입니다...</p>
      </div>
    </div>
  );
};

export default LoadingSequence;