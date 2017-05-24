# git-hook

中转 github webhook

## 启动 server

`docker run -p 3001:3001`

## 启动 client

`docker run --restart=always -v path_of_tasks:/var/git-hook/tasks -e APP=client TASKS_PATH=/var/git-hook/tasks`