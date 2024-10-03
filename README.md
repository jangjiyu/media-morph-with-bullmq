# Morph Media

## Description

This project is a [NestJS](https://docs.nestjs.com/) server designed to convert and resize images and videos into different formats. It follows an MVC structure using a NestJS server, along with HTML, CSS, and JavaScript. To reduce server load, [BullMQ](https://docs.nestjs.com/techniques/queues) is used to handle image and video conversion and resizing tasks in the background.

## Running the app with Docker Compose

docker-compose is required to run this project.

```bash
$ docker-compose up
```

## Access the client

Navigate to `http://localhost:3000/client` to access the client.
