# Stage 1: Build Spring Boot backend using Maven
FROM maven:3.9.6-eclipse-temurin-17-alpine AS build
WORKDIR /app

# Copy build descriptor and backend source
COPY pom.xml ./
COPY backend/pom.xml backend/pom.xml
COPY backend/src backend/src

# Build package and skip tests to ensure quick build
RUN mvn clean package -DskipTests -f backend/pom.xml

# Stage 2: Minimal Java 17 runtime
FROM eclipse-temurin:17-jre-alpine
WORKDIR /app

# Copy the generated executable jar
COPY --from=build /app/backend/target/*.jar app.jar

# Render assigns a dynamic port via $PORT (Spring Boot uses ${PORT:8085})
EXPOSE 8085

# Run Spring Boot
ENTRYPOINT ["java", "-Djava.security.egd=file:/dev/./urandom", "-jar", "app.jar"]
