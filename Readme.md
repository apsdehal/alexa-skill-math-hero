# Math Hero

Alexa skill for kids that asks multiple choice questions from various topics in mathematics. 
You can level up in the game and get stronger with time. Rationale/solutions for questions are provided for better learning.

## Inspiration

For providing an easy platform for learning simple as well as advanced mathematics. My aim was to gamify this experience by adding a levelling up scenario and thus, making this game interesting for kids.

## Alexa Skill ID
amzn1.ask.skill.fa757529-588d-42e3-848b-6d28348f8d6b

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


## Challenges I ran into

The conversation model of the skill was becoming quite complex and had numerous issues as I was providing score based on the time taken to solve the question. I also had to find out a clear way to communicate the question to user as alexa sometimes spoke too fast. I built up the persistence using dynamodb where I stored the important details related to the current question and the start time itself, the request was made before speaking. I added multiple interaction points so as to have a smooth conversation flow. Further, I used cards in alexa app to clearly communicate the question to the users. 

As alexa speaked very fast sometimes, impossible for the kids to understand some time, I added multiple 1s and 500ms pauses in between the speech to make it look more human-like.

## What I learned

Simple interactions and conversations are not as simple as it seems. Before gamifying the experience it was boring. Gamifying the skill really improved the interest in children as it adds a whole new dimension to the interaction.

## What's next

- I would like to implement a leader-board system based on the already stored score.
- I would like to add more questions (currently around 200)
- I would like to improve the conversation model further.

## Credits

AQuA dataset by Deepmind.

## License
MIT
