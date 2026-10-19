# Stage 1: Build Spring Boot backend using Maven
FROM maven:3.9.6-eclipse-temurin-17-alpine AS build
WORKDIR /app

# Copy pom.xml and source code
COPY pom.xml .
COPY src ./src

# Build package and skip tests
RUN mvn clean package -DskipTests

# Stage 2: Minimal Java 17 runtime
FROM eclipse-temurin:17-jre-alpine
WORKDIR /app

# Copy the generated executable jar
COPY --from=build /app/target/*.jar app.jar

# Render assigns a dynamic port via $PORT
EXPOSE 8085

# Run Spring Boot
ENTRYPOINT ["java", "-Djava.security.egd=file:/dev/./urandom", "-jar", "app.jar"]
