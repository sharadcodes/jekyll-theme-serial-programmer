---
layout: post
title: Run Pi-Hole in localhost and some extras
date: 2022-03-19 10:18:00
categories: [fiction, jekyll]
---

![header image](/assets/images/2022-03-19-Run-Pi-Hole-in-localhost-and-some-extras/save.drawio--1-.png)

I was looking for a way to run Pi-Hole everywhere with me, the first attempt was to host it in a VPS (Virtual Private Server) with a public IP, although it was fast and all but at a certain time because it was a public DNS other DNS services were bombarding the server with requests, so this isn't a valid option (it wasn't from the beginning but little I know, I tried it). Thankfully, the community over /r/pihole/ was very helpful to understand the wrong approach to my solution. So I had to go back to the drawing board. Another solution was to create my personal VPN service and there to access my everywhere Pi-Hole, but back then I didn't know anything about hosting my own VPN service, it was a little difficult to understand the infrastructure the easiest that I successfully deployed was a WireGuard service, but I don't like it because it wasn't straightforward to join my devices. I was generating new users and then new codes and then "translated" it to qr-codes from the command line(I like very much the command line, the flexibility and the speed of configuring things, but I don't like to do it for all my family and friends that wants to join the network) Eventually I found a docker container based project that deploys every service that is needed in a local server, but it was very slow, very convent with very useful UI but very slow, I will re-try to use it in a local server with a nice router maybe with Pf-Sense. Finally, I was thinking about to host Pi-Hole in a local container, which apparently has some more functionalities than I was thinking.

## Install Docker, Docker-Compose

The installation for the docker varies from operating system to operating system, I use Linux, specifically Debian based (Ubuntu) for servers and Arch  based (Manjaro) for pc or laptop so for those systems:

### Debian Based
```bash
sudo apt update
sudo apt upgrade -y
sudo apt install docker
sudo apt install docker-compose
sudo usermod -aG docker $USER
sudo systemctl enable docker
sudo systemctl start docker
# Log Out from session or restart to add user to the user-group
```

### Arch Based
```bash
sudo pacman -Syu
sudo pacman -S docker
sudo pacman -S docker-compose
sudo usermod -aG docker $USER
sudo systemctl enable docker
sudo systemctl start docker
# Log Out from session or restart to add user to the user-group
```
For Mac, follow  these instructions, be careful with the selection between intel and M1 chips.
For Windows, follow these instructions.

Portainer Installation
The first container that I usually deploy is Portainer Community Edition is an impressive docker and docker-compose manager, it has more capabilities, but I don't use it for this implementation. To read more about Portainer go here.

```bash
docker volume create portainer_data
docker run -d -p 8000:8000 -p 9000:9000 --name portainer \
    --restart=always \
    -v /var/run/docker.sock:/var/run/docker.sock \
    -v portainer_data:/data \
    portainer/portainer-ce:2.9.3
```
If in this step, the commands didn't run successfully, either the docker service isn't running or you don't have correctly added your user to the docker user-group. If this was successful, then fire up a browser and go to [http://localhost:9000](http://localhost:9000) then create an administrator user.

![Portainer setup](/assets/images/2022-03-19-Run-Pi-Hole-in-localhost-and-some-extras/be-server-setup-1.png)

Then, when you are successfully logged in, press Get Started and then the local environment. From here, the docker engine and docker manager is installed and ready.

## Pi-Hole container

The best way to manage containers for me is docker-compose throw Portainer-CE. To deploy a docker-compose YAML you have to navigate in Portainer local environment and then from the drawer in the left go to Stacks and then click on add stack blue button, after that you have to fill the name input and paste the following config in the field below.

```yaml
version: "3"
services:
  pihole:
    container_name: pihole
    image: pihole/pihole:latest
    ports:
      - "53:53/tcp"
      - "53:53/udp"
      - "67:67/udp"
      - "8081:80/tcp"
    env_file:
      - .env
    environment:
      TZ: 'Europe/Berlin' # Change that with your timezone
      WEBPASSWORD: 'ThisIsaPlaceholder'
    volumes:
       - './etc-pihole/:/etc/pihole/'
       - './etc-dnsmasq.d/:/etc/dnsmasq.d/'
    dns:
      - 127.0.0.1
      - 1.1.1.1
    cap_add:
      - NET_ADMIN
    restart: unless-stopped
```

You have to change the **WEBPASSWORD** (to a rememberable password) and **TZ** (to your local timezone) environment variables also you can customize more by adding more or deferment secondary DNSs. The ports I have bind them to different ports, are the 56 UDP/TCP and 67 UDP, that is important to DNS functionality, for reason that I will explain later in this post I have bind the port 80 TCP elsewhere.
After the configuration of your Pi-Hole press the button **Deploy the Stack** and wait for some time to download the image and deploy the container. To confirm that the container is ready and running, go to containers page and check in the list if the Pi-Hole is green. Now that is up, go to your browser to [http://localhost:8081](http://localhost:8081).

### Change the network DNS

Now you have to change your DNS settings in your operating system to 127.0.0.1 to use the Pi-Hole, this is different for each operating system in Gnome I have to change it from the Wi-Fi settings or network settings in the case that I am connected via the Ethernet.

![DNS setup](/assets/images/2022-03-19-Run-Pi-Hole-in-localhost-and-some-extras/image-1.png)

### More you can do with Pi-Hole

Basically, the Pi-Hole is a full-fledged DNS service you can create and assign local domains, and this is the nice thing about this configuration besides the fact that the Pi-Hole is a very good DNS based ad-blocker you can use it to resolve local domains and this is way in the next section I will install Nginx Proxy Manager.

## Nginx Proxy Manager container

Nginx Proxy Manager is a very impressive containerized nginx service with a very useful frontend with a database that can store SSL keys and more option besides to configure everything from the terminal and restart the nginx service each time you add a new domain or configuration. The docker-compose YAML is the following:

```yaml
version: '3'

volumes:
  npm-data:
  npm-ssl:
  npm-db:

networks:
  frontend:
  backend:

services:
  npm-app:
    image: jc21/nginx-proxy-manager:latest
    restart: always
    ports:
      - "80:80"
      - "81:81"
      - "443:443"
    environment:
      - DB_MYSQL_HOST=npm-db
      - DB_MYSQL_PORT=3306
      - DB_MYSQL_USER=npm
      - DB_MYSQL_PASSWORD=replace-with-secure-password
      - DB_MYSQL_NAME=npm
    volumes:
      - npm-data:/data
      - npm-ssl:/etc/letsencrypt
      - /opt/websites:/mnt/user/appdata/NginxProxyManager/websites
    networks:
      - frontend
      - backend
  npm-db:
    image: jc21/mariadb-aria:latest
    restart: always
    environment:
      - MYSQL_ROOT_PASSWORD=replace-with-secure-password
      - MYSQL_DATABASE=npm
      - MYSQL_USER=npm
      - MYSQL_PASSWORD=replace-with-secure-password
    volumes:
      - npm-db:/var/lib/mysql
    networks:
      - backend
```

Following the same steps for the deployment of the stack as I did with the Pi-Hole docker-compose. If everything went alright then go to [http://localhost:81](http://localhost:81) and the first credentials is admin@example.com and the password is changeme, upon the first login you are prompted to change the login credentials again put something easy is only for "internal" consumption. And that's all for this step.

## Setup local domains and reverse proxy

Now that all services need is ready let's create some local domains, for the simplicity of this example we will use the three services that we initiate in until now the Portainer, the Pi-Hole admin page and the NPM admin page. To create domains, you have to go to the [http://localhost:8081/admin](http://localhost:8081/admin) then navigate to Local DNS from the left drawer menu and then click on the DNS Records. Here we create local domains, we will add three domains nginx.me, pihole.me and portainer.me, and assign all of them in the loop-back IP e.g. 127.0.0.1. In the end, you will have something like this:

![local domain setup](/assets/images/2022-03-19-Run-Pi-Hole-in-localhost-and-some-extras/image-2.png)


Now navigate to Nginx Proxy Manager [http://localhost:81](http://localhost:81) and the go to Proxy Hosts and press Add Proxy Host from the top left of the proxy hosts table. Alongside with Nginx Proxy Manager, go to portainer [http://localhost:9000](http://localhost:9000) to grab the IP from the network inside the npm-app container, to do so go to containers page and open the npm-app container in the bottom of the page is the connected networks of the container in this particular container we have joined two networks, the backend and the frontend, we want the gateway from the backend to reverse proxy the ports from the other services that they are exposed in the localhost. In my case, the gateway IP is 172.26.0.1.

![Docker network](/assets/images/2022-03-19-Run-Pi-Hole-in-localhost-and-some-extras/image-3.png)

Let's go and create the reverse proxy for the pihole admin page we need configure as shown under:

![NGINX setup](/assets/images/2022-03-19-Run-Pi-Hole-in-localhost-and-some-extras/image-4.png)

Now go to [http://pihole.me/admin](http://pihole.me/admin) to test the reverse proxy if every thing is ok, then repeat two more times for the [portainer.me](portainer.me) => 172.26.0.1:9000 and [nginx.me](nginx.me) => 172.26.0.1:81.

## Conclusion

This was a very nice way to use Pi-Hole and some capabilities in the localhost of my system, also is very good way to practice for a server setup if you are in the system administrator path or generally a developer with a better understanding for the application deployment. The complexity and the overhead of this service stack is not very hard to run even with lower ram system.

![CTOP](/assets/images/2022-03-19-Run-Pi-Hole-in-localhost-and-some-extras/image-5.png)

For sure is a little unnecessary but a nice configuration in a daily development and media consumption setup. In the next time that I will have time I want to explore some more the Pi-Hole with a Grafana configuration.