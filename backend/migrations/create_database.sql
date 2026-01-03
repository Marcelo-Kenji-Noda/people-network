
CREATE DATABASE people_network;
-- Optional dedicated app user:
CREATE USER people_user WITH PASSWORD 'Change_Me_123!';
GRANT ALL PRIVILEGES ON DATABASE people_network TO people_user;