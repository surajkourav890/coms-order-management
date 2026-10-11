# Build the Spring Boot API from the monorepo root for Cloud Run.
FROM maven:3.9-eclipse-temurin-17 AS build
WORKDIR /workspace/backend/coms-backend
COPY backend/coms-backend/pom.xml ./pom.xml
COPY backend/coms-backend/src ./src
RUN mvn -B -DskipTests package

FROM eclipse-temurin:17-jre
WORKDIR /app
COPY --from=build /workspace/backend/coms-backend/target/coms-backend-0.0.1-SNAPSHOT.jar /app/coms-backend.jar
EXPOSE 8080
ENTRYPOINT ["java", "-jar", "/app/coms-backend.jar"]
