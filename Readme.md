# Math Hero

Alexa skill for kids that asks multiple choice questions from various topics in mathematics. 
You can level up in the game and get stronger with time. Rationale/solutions for questions are provided for better learning.

## Technology

- Uses `alexa-app` framework by alexa-js team.
- Uses AWS Lambda for the backend.
- Uses AWS Dynamo DB for storage about user's information and levels and for persistence.
- Shows cards in alexa app so that players can better answer by reading the question clearly.


## Playthrough

- Questions are asked in a form on trivia. 
- In a single trivia, 5 multiple choice questions are asked.
- These multiple choice questions are from a set of around 200 questions and are randonly selected.
- There are 5 options for each question and involves concept from various topics in mathematics.
- Scoring is based on how fast the question is solved and is inversely proptional to the time taken.
- There is a maximum time you can take to solve a question. Exceeding that time would results in 0 score for that question.
- After scoring a total of 5 points, which sum up accross different trivias you completed, you will level up.
- Level up decreases the maximum time you have to solve the question, thus making the game harder. You will need to become fast to level up further
- You always have an option to skip a question by saying `I don't know` or `skip`.
- Questions can also be repeated for clarification. Cards are also shown on the alexa app.
- The timer starts as soon as alexa starts speaking.
- Rationale/solutions for the questions are provided once you answer the question.

## Interaction

To start the skill, say:

> alexa, start math hero

Alexa will respond with the introduction phrase which also tells you your current level if you restarted the game. Now, when you are playing first time, you should ask for help by saying:

> help

Alexa will respond with help for your current level.

Now, start trivia by saying

> start trivia 

if your session is open or by saying

> alexa, tell math hero to start a trivia

Alexa will now start a trivia and respond with a question. See the alexa app on your mobile for clear information on question.

If your answer is A, answer by saying:

> alexa, tell math hero my answer is A

or if you don't know, you can say:

> alexa, tell math hero I don't know

otherwise, you can also ask alexa to repeat by:

> alexa, tell math hero to repeat

Continue the trivia or ask for rationale. After completing 5 questions, you will be rewarded with the score for this trivia which will be added to your total score.
Alexa will also tell you when you level up.

## Credits

AQuA dataset by Deepmind.

## License
MIT
