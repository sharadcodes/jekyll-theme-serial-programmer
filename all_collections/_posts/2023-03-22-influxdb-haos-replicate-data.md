---
layout: post
title: Run Home Assistant with influxdb and replication
date: 2023-03-21 00:46:00
categories: [self-host, smart-home]
---

![header image](/assets/images/2023-03-22-influxdb-haos-replicate-data/banner.png)

As the world becomes increasingly connected through IoT, the need for reliable data storage and transfer has become crucial. Raspberry Pi has been a popular choice as an IoT gateway, however, ensuring data retention without internet connectivity is challenging. In this article, we'll explore how using InfluxDB replication feature can help retain data on Raspberry Pi even in the absence of internet connectivity. We'll also discuss how Home Assistant can be used to scrape data from a UPnP router service to store locally in InfluxDB instance. By leveraging these tools, you can ensure your IoT devices remain online, collecting and storing critical data no matter what.

## What is Home Assistant and influxDb ???

Home Assistant is an open-source home automation platform that allows users to connect and control a wide range of smart devices from various manufacturers. It enables users to set up automated routines, control their devices through voice assistants like Amazon Alexa or Google Assistant, and access the platform via a web interface or mobile app. Home Assistant also offers advanced features such as data scraping, machine learning, and custom integrations with third-party services. Overall, it is a powerful tool that allows users to create a personalized and integrated smart home experience.

InfluxDB is a popular open-source time-series database designed for storing and querying large amounts of timestamped data such as metrics, events, and IoT sensor data. It has a powerful query language that allows users to aggregate and manipulate data in real-time. InfluxDB is often used in IoT systems where there is a need to store and analyze high volume, continuous streams of data over time. Additionally, it supports features like retention policies, which let you define how long data should be kept, and continuous queries, which provide insights into real-time trends and predictions. Overall, InfluxDB is a scalable and reliable choice for those dealing with time-series data.

## Deploy Influxdb

In this setup, we have hosted an InfluxDB OSS instance on a Virtual Private Server (VPS) using docker containers and a docker-compose stack. To ensure easy management, we have set up a reverse proxy in front of the instance with the help of nginx proxy manager. You can find the documentation for deploying Nginx Proxy Manager (NPM) [here](https://nginxproxymanager.com/). Additionally, we suggest using the [Portainer CE](https://docs.portainer.io/) tool to effectively manage your Docker containers.

Below is an example Docker Compose file for an InfluxDB OSS instance. Be sure to change the admin password before deploying it. This service will run on port `8086`, and at the bottom of the file, you need to update the name of the nginx proxy manager network. Additionally, adding `external: true` is necessary because this is an already existing Docker network that needs to be connected with the new service. To run the docker compose you can run `docker compose up -d` or just deploy with portainer.

```yaml
version: '3.6'
services:
  influxdb:
    image: influxdb:latest
    container_name: influxdb
    restart: always
    environment:
      - INFLUXDB_DB=influx
      - INFLUXDB_ADMIN_USER=admin
      - INFLUXDB_ADMIN_PASSWORD=CHANGEME
    networks:
      - nginx-proxy-manager_backend
    volumes:
      - influxdb_data:/var/lib/influxdb
volumes:
  influxdb_data: {}
networks:
  nginx-proxy-manager_backend:
    external: true
```

Once the docker-compose stack is deployed, configuring the reverse proxy with Nginx Proxy Manager requires following the image below. To do this, it is necessary to have a registered domain. For example, in my case, I chose to use the `influx...` subdomain. Additionally, socket connection and SSL should be enabled to ensure secure and stable connection.

![NPM image](/assets/images/2023-03-22-influxdb-haos-replicate-data/influx_NPM.png)

## Deploy Home Assistant and local InfluxDb OSS

## Connect Home Assistant, InfluxDb and add UPnP for data

## Create replication link

## Conclusion