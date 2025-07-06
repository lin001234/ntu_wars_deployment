- [1. Introduction](#1-introduction)
  - [1.1 Features of Our Project](#11-features-of-our-project)
- [2. To get Started](#2-to-get-started)
  - [2.1 Some Examples](#21-some-examples)
- [3. To run Docker Container in Development](#3-to-run-docker-container-in-development)
  - [3.1 Basic docker-compose commands](#31-basic-docker-compose-commands)
  - [3.2 To run the docker-compose file](#32-to-run-the-docker-compose-file)
- [4. Acknowledgments](#4-acknowledgments)

# 1. Introduction
**ntu_stars_swapper**
A website that facilitates the swapping of index between individuals through posts and chats, making the process easier and simpler.
Built using React and Expressjs, along with socket.io for real-time chat application

## 1.1 Features of Our Project
Notable features include:
Authentication using Google's OAuth for registering users
Implementing CRUD operations with APIs on Supabase, using posts as the data format
Socket.io integration to enable real-time chats among users
Simple React-Boostrap UI
Smaller features such as profile customisation and the usage of a toxicity API to detect bad language in chats

# 2. To get Started
Requirements
Install nodejs -> https://nodejs.org/en

Once done, we need to start the frontend and backend servers
1. To start the backend server, create a new terminal and type
```
cd backend
npm i
npm run dev
```
2. To start the frontend server, create another new terminal and type
```
cd frontend
npm i
npm run dev
```
3. In the frontend terminal, you should see that the server will now be hosted on a url like "http://localhost:5173/"
crtl + click on the link or copy and paste it into a browser to start trying out the website

## 2.1 Some Examples
You can start by trying to create a post, followed by using the search feature to filter out posts you want to see
Try editing your profile in "Profile" or edit your newly posted request on "Own Posts"
Try messaging a owner of a post and communicating (Note: Use incognito or another browser with a different account)

# 3. To run Docker Container in Development
We have both docker-compose as well as Dockerfile, where the dockerfile build the Docker image and docker-compose.yml is a config file that specify how the images should be run

## 3.1 Basic docker-compose commands
1. Build and Start (-d for detached)
```
docker-compose up --build 
```
2. Rebuild specific service
```
docker-compose build ${service}
```
3. Stop the services
```
docker-compose down
```
4. Stop and remove everything
```
docker-compose down -v
```
5. Restart service
```
docker-compose restart ${specific service if needed}
```
6. View Logs
```
docker-compose logs -f ${specific service if needed}
```
7. Access backend container shell
```
docker-compose exec backend sh
```
8. Start and stop containers without rebuilding
```
docker-compose start
docker-compose stop
```

## 3.2 To run the docker-compose file 
1. Start Docker Desktop application

2. Run docker-compose file on terminal
```
docker-compose up --build 
```

# 4. Acknowledgments
Created by Lin and Wei Jie