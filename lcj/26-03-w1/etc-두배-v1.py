'''
# 구현 설계

1. 한 번의 작업 : A[i]에 대해 max(i, A[i] + i)
-> 뒤쪽 인덱스부터 추가해주는 것이 베스트?

--> 한 턴의 선택을 전체의 최선으로 : 탐욕

2. 리스트 사용, 반복 횟수를 모르니까 while (조건 = sum > 2N)
- goal = 2N
- difference = goal - sum(arr)
- for 0 ~ N-1에 대해, max(A[i] + i, i)로의 변화량을 계산
- sort(Rev) 후에, 하나씩 더해가며 diff 넘길 때 까지 카운팅

'''
import sys
sys.stdin = open('input.txt', 'r')

T = int(input())

for tc in range(1, T+1):

    N = int(input())
    arr = list(map(int, input().split()))

    # 1. 기준선(goal)과 차이값 계산 -> 최종 목표 : 기준선을 돌파하는 것
    goal = N*2
    difference = goal - sum(arr)

    # 2. 인덱스 별 최대 변화량 계산
    # 변화량을 저장하기 위한 리스트
    change = [[] for _ in range(N)]

    # (1) 변화량 계산
    for i in range(1, N+1):
        change[i-1] = max(arr[i-1] + i, i) - arr[i-1]

    # (2) 최대값부터 고르기 위해 내림차순 정렬
    max_change = sorted(change, reverse=True)  # 0번 인덱스는 제외


    # (3) 변화량 계산을 위한 변수 지정
    difference_sum = 0
    change_count = 0
    idx = 0

    # (4) 값을 바꿀 때마다 카운트 +1, 목표 달성 시까지
    while difference_sum < difference:

        difference_sum += max_change[idx]
        change_count += 1
        idx += 1

    print(f"#{tc} {change_count}")