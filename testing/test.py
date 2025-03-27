from openSATApi import openSAT as oSAT
import random

possibleQuestions = oSAT().getQuestionNum('math', 'Algebra')
qNum = random.choice(possibleQuestions)
question = oSAT().getQuestionByNum(qNum, 'math', 'Algebra')
#print(question)

print(qNum, question['domain'], question['visuals'], question['question']['question'], sep='\n\n')
for choice in question['question']['choices']: print(choice, question['question']['choices'][choice], sep=') ')
userAnswer = input("Enter your answer: ")
if userAnswer.lower() == question['question']['correct_answer'].lower():
    print("Correct!")
else:
    print("Incorrect!")
    print(f"The correct answer is {question['question']['correct_answer']}")
    print(f"This is because {question['question']['explanation']}")