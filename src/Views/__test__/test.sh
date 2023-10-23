#!/bin/bash

# 设置URL和参数
url="https://gj.dtjklive.com/app/bus/getTimeTable"
routeID="353"
token="0a6496ebc500451699606cf33639a6b5"

# 发送HTTP POST请求
response=$(curl -s -X POST -H "Content-Type: application/json" -d '{"routeID":"'"$routeID"'"}' "$url")

# 提取JSON响应中的downTimeList字段
time=$(echo "$response" | jq -r '.data.downTimeList[] | select(. <= "17:30")' | sort | tail -n 1)

# 发送通知
title="公交车到站时间"
content="$time"
template="html"
curl -s "http://www.pushplus.plus/send?token=$token&title=$title&content=$content&template=$template"
