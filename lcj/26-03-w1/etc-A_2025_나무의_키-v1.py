'''
# 문제 조건


# 1. 하루에 한 나무씩 물 줄 수 있다

# 2. 짝수 날 물을 줄 경우 2씩 자란다.

# 3. 물을 주지 않을 수 있다.

# 4. 모든 나무의 키가 가장 키가 컸던 나무와 같아지도록 하는 최소 날짜 수를 출력

# 문제 입력

T 테스트 케이스 수
N 나무의 개수
(N개의 나무 키)

# 문제 접근

1. arr (나무의 키) 중 가장 큰 나무의 키 = goal
-> 모든 트리 >= goal -> 종료

2. 경우의 수를 어떻게 나눌 것인가
- 첫째 날 물을 준 경우와 주지 않은 경우를 나눌 수 있을까?

3. Day 변수는 반드시 필요하다

# 슈도 코드

1. goal = max(arr), sort(rev) -> target = arr[1:]

2. target에 대해
- day 1에 물을 준 경우 -> 리스트 append, water, day 변수
- 주지 않은 경우 -> 리스트 append, water, day 변수

3. pop -> for tree in target -> if tree < goal : 물주기 이후 water = 1, day += 1

4. 반복 -> 종료 조건 만족 시 global 변수에 대해 갱신 후 계속

-> 구현 설계 약 22'
'''
import sys
sys.stdin = open('input.txt', 'r')
from collections import deque

T = int(input())

def bfs_watering(arr): # 일차 별로 (1) 물을 줬을 때, (2) 아닐 때의 상태를 번갈아가며 갱신하는 함수

    q = deque()
    goal_height = max(arr) # 목표 키 입력받기
    target_group = sorted(arr, reverse= True)[1:] # 물을 줘야할 타겟 나무들
    day = 0
    
    
    # test 1. 필요 변수 확인
    # print(target_group, goal_height)

    q.append([target_group, goal_height, day])
    
    while q:
        
        target, goal, day = q.popleft()
        
        # 1. 종료 조건 파악
        
        for tree in target: # 물을 줄 트리들에 대해
            if tree != goal: # 목표 높이와 같다면
                break
            
        else: return day
        
        # 2. 물 O / X 케이스를 각각 push
        day += 1
        target.sort()
        
        if day % 2 == 1: #(1) 홀수 날에
            
            # (1)-1 물을 안 줬을 때 -> 바로 큐에 push
            no_water = sorted(target)
            q.append([no_water, goal, day])
            
            # (1)-2 물을 줬을 때 -> 바로 큐에 push
            
            yes_water = sorted(target)
            yes_water[0] += 1
            q.append([yes_water, goal, day])


        elif day % 2 == 0: # (2) 짝수 날에
            
            # (2)-1. 물을 안줬을 때 -> 바로 큐에 push
            no_water = sorted(target)
            q.append([no_water, goal, day])            
            
            # (2)-2. 물 줬을 때
            yes_water = sorted(target)
            yes_water[0] += 2
            q.append([yes_water, goal, day])


for tc in range(1, T+1):
    
    N = int(input()) # 나무의 개수 N
    arr = list(map(int, input().split())) # 나무 키 리스트
    
    result = bfs_watering(arr)

    print(f"#{tc} {result}")