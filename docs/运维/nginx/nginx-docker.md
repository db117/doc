#### docker 启动

```
sudo docker run --name my-nginx -p 80:80 -p 443:443 --network my_net -v $PWD/conf/nginx.conf:/etc/nginx/nginx.conf:ro -v $PWD/ssl:/ssl -v $PWD/logs:/logs  -d nginx

```

