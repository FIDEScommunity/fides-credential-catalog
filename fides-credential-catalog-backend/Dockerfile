FROM mcr.microsoft.com/openjdk/jdk:21-ubuntu AS builder
WORKDIR application
ARG JAR_FILE=target/credential-catalog-backend-0.0.1-SNAPSHOT.jar
COPY ${JAR_FILE} application.jar
RUN java -Djarmode=layertools -jar application.jar extract

FROM mcr.microsoft.com/openjdk/jdk:21-mariner
WORKDIR application
ENV TZ=Europe/Amsterdam
RUN ln -snf /usr/share/zoneinfo/$TZ /etc/localtime && echo $TZ > /etc/timezone
COPY --from=builder application/dependencies/ ./
COPY --from=builder application/spring-boot-loader/ ./
COPY --from=builder application/snapshot-dependencies/ ./
COPY --from=builder application/application/ ./
USER nobody
ENTRYPOINT ["java", "org.springframework.boot.loader.launch.JarLauncher"]
