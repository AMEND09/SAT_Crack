import requests

class openSAT():
    def getQuestionNum(self, section, domain):
        question_objects = requests.get('https://api.jsonsilo.com/public/942c3c3b-3a0c-4be3-81c2-12029def19f5').json()
        collected_nums = [index for index, question in enumerate(question_objects[section], start=1)  if question.get('domain') == domain]
        return collected_nums
    
    def getQuestionByNum(self, num, section, domain):
        question_objects = requests.get('https://api.jsonsilo.com/public/942c3c3b-3a0c-4be3-81c2-12029def19f5').json()
        q = [index for index, question in enumerate(question_objects[section], start=1)  if question.get('domain') == domain]
        if not num in q:
            raise ValueError(f"Question number {num} not found in the specified domain {domain}.")
        question = question_objects[section][num-1]
        return question