# 이미지 선택 
FROM nginx

# 이미지 후 만들어진 루트 디렉토리 
WORKDIR /

# 빌드된 결과물 NGINX 폴더에 복사
COPY ./dist /usr/share/nginx/html

# 기본 nginx 설정 파일을 삭제 (TogAICRM.VUE 설정과 충돌 방지)
RUN rm /etc/nginx/conf.d/default.conf

# TogAICRM.VUE/nginx 설정파일을 컨테이너 내부로 복사
COPY nginx/nginx.conf /etc/nginx/conf.d

# 컨테이너의 80번 포트 지정
EXPOSE 80

# nginx 서버를 실행하고 백그라운드로 동작
CMD ["nginx", "-g", "daemon off;"]