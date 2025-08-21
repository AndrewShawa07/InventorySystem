CREATE DATABASE cards_app;
USE cards_app;

CREATE TABLE cards (
  id integer PRIMARY KEY AUTO_INCREMENT,
  title VARCHAR(255) NOT NULL,
  contents TEXT NOT NULL,
  created TIMESTAMP NOT NULL DEFAULT NOW()
);

INSERT INTO cards (title, contents)
VALUES 
('My First Note', 'A note about something'),
('My Second Note', 'A note about something else');