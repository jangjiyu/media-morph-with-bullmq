# Morph Media

## Description

This project is a [NestJS](https://docs.nestjs.com/) server designed to convert and resize images and videos into different formats. It follows an MVC structure using a NestJS server, along with HTML, CSS, and JavaScript. To reduce server load, [BullMQ](https://docs.nestjs.com/techniques/queues) is used to handle image and video conversion and resizing tasks in the background.

## Installation

```bash
$ npm install
```

## FFmpeg

FFmpeg installation is required to run the app. You can install it using the following commands:

##### Windows

```bash
$ choco install ffmpeg
```

##### Mac

```bash
$ brew install ffmpeg
```

##### FFmpeg Official Website

[Download FFmpeg](https://www.ffmpeg.org/download.html)

## Running the app

```bash
# development
$ npm run start

# watch mode
$ npm run start:dev
```

## Running the app with Docker Compose

```bash
$ docker-compose up
```

## Access the client

Navigate to `http://localhost:3000/client` to access the client.
