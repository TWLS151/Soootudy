'''

1. 문제 재해석

트럭 마다 주어진 화물 리스트 중 최대값을 total에 더해주는 방식 -> 탐욕

2. 구현 설계

- 트럭의 크기만큼의 빈 리스트 생성
- sort 한 뒤, 화물의 뒤에서부터 이어서 보면서 작거나 같으면 append
- trucks의 sum이 곧 최대 무게가 되게끔
'''


import sys
sys.stdin = open('input.txt' ,'r')

T = int(input())

for tc in range(1, T+1):

    N, M = map(int, input().split()) # 화물 수 N, 트럭 수 M
    container = list(map(int, input().split()))
    truck = list(map(int, input().split()))

    container.sort(reverse=True)
    truck.sort(reverse=True)

    if min(container) > max(truck):                 # 만약 화물을 하나도 실을 수 없다면 0
        print(f"#{tc} 0")
        continue


    # 1. 운반 리스트 만들기
    moving = []

    # 2. 화물을 순회하며 트럭마다 최대의 화물 싣기

    cnt = 0
    i = 0
    j = 0

    while True:

        if container[i] <= truck[j]:    # i번째 화물이 j번째 트럭의 적재용량 안이라면
            moving.append(container[i])    # 싣기
            cnt += 1                    # 카운트 증가
            i += 1                      # 다음 화물로
            j += 1                      # 다음 트럭으로

        else:
            i += 1                    # 적재용량 이상이라면 -> j번째 트럭에 i+1번째 화물 싣기 시도

        if i == len(container) or j == len(truck):           # 다 실었다면 정지
            break

    print(f"#{tc}", sum(moving))
