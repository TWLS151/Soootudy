'''
문제 조건
# 입력 : 화물 개수, 탑의 높이가 순차적으로 주어짐
# N W1 W2

접근 
# 1. 각 탑의 최저층부터 무거운 화물을 쌓자

# 2. 층 수만큼 0으로 된 리스트를 계산

# 3. 각 탑 별로 (인덱스 +1) * 화물 무게를 계산하자
'''

import sys
sys.stdin = open('input.txt', 'r')

T = int(input()) # tc

def stacking_block(N, w1, w2):

    freight = list(map(int, input().split())) # 화물 무게 (list), 길이 N

    t1 = [0]*w1 # 탑의 높이만큼 빈 리스트 생성
    t2 = [0]*w2 

    for idx in range(N):

        # 핵심 : 무거운 순서대로 아래부터 화물을 넣자

        # 어? 그러면 그냥 내림차순으로 sort해서 탑의 각 층의 수 만큼 숫자 넣어주면 끝 아님?
        # ex. 1층 두개 -> 5 4, 2층 2개 -> 3 2, 3층 1개 -> 1
        # 어떻게 구현할까... to be continued
        for j in range(2):




for tc in range(1, T+1):

    N, W1, W2 = map(int, input().split())

    result = stacking_block(N, W1, W2)