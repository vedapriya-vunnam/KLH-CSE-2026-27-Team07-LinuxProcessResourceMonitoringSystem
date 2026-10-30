FROM eclipse-temurin:17-jdk

WORKDIR /app

COPY backend/ ./backend/
COPY logs/ ./logs/

WORKDIR /app/backend

RUN javac ProcessAPI.java

EXPOSE 8080

CMD ["java", "ProcessAPI"]
