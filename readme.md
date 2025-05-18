curl --location 'http://localhost:3000/users/' \
--header 'Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjY3ZmE4ZGVjOGMwYWM1MjJjZmVmYmI5YSIsInVzZXJuYW1lIjoidXNlciIsInJvbGUiOjAsImlhdCI6MTc0NDQ3NDk0MCwiZXhwIjoxNzQ0NDc4NTQwfQ.FW85CUV76hq1oaKJH7iWjNatdN27L1rJZp92ZtY9DdE'


curl --location 'http://localhost:3000/users/create' \
--header 'Content-Type: application/json' \
--data '{
    "username": "user1",
    "password": "1"
}'

curl --location 'http://localhost:3000/users/findByUserName' \
--header 'Content-Type: application/json' \
--data '{
    "username": "vcd"
}'

curl --location 'http://localhost:3000/users/login' \
--header 'Content-Type: application/json' \
--data '{
    "username": "user",
    "password": "1"
}'

curl --location 'http://localhost:3000/users/changePassword' \
--header 'Content-Type: application/json' \
--data '{
    "username": "vcd",
    "password": "2222",
    "newpassword": "1111"
}'

curl --location 'http://localhost:3000/users/deleteUser' \
--header 'Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjY3ZmE4ZGUyOGMwYWM1MjJjZmVmYmI5OCIsInVzZXJuYW1lIjoiYWRtaW4iLCJyb2xlIjoxLCJpYXQiOjE3NDQ0NzQ1NzYsImV4cCI6MTc0NDQ3ODE3Nn0.eFA_f7vAxLfWsRPxf_iqsx-7X8pyxf_mReE1-oWnPu8' \
--header 'Content-Type: application/json' \
--data '{
    "username": "user1"
}'