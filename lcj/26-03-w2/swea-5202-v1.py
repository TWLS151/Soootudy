'''

1. 문제 재해석 - 가능한 한 많은 화물이 운반되도록 시간대를 배치 (탐욕)

2. 구현 설계
- 끝나는 시간이 빠른 순서대로 정렬 -> 어짜피 시작은 그보다 빨라야 한다.

- 하나씩 리스트에 넣으면서

'''

import sys
sys.stdin = open('input.txt', 'r')
T = int(input())

for tc in range(1, T + 1):

    N = int(input())

    # 1. schedule 리스트에 모든 신청 작업을 할당
    schedule = []
    for _ in range(N):
        s, e = map(int, input().split())
        schedule.append((s, e))

    # 2. 끝나는 시간이 가까운 순으로 작업을 승인 (리스트에 할당)
    schedule.sort(key=lambda x: x[1])

    # 3. 승인할 화물 리스트 생성
    approved = []
    i = 0  # 스케쥴 포인터
    j = 0  # 승인된 작업 포인터
    cnt = 0  # 승인한 작업 수

    # 4. 모든 스케줄을 순회하면서 가능한 만큼 승인하기
    while i < len(schedule):

        if not approved:  # 비어있다면 넣고 시작
            approved.append(schedule[i])
            i += 1
            cnt += 1
            continue

        else:  # 차있다면 - 검사 시작
            if schedule[i][0] < approved[j][1]:  # (1) 시작 시간이 이미 승인한 작업의 종료시간보다 빠르면
                i += 1  # 해당 작업은 승인할 수 없음
                continue

            else:  # (2) 아니라면
                approved.append(schedule[i])  # 승인한 후, 스케쥴 포인터와 승인 작업 포인터를 모두 1씩 증가
                i += 1
                j += 1
                cnt += 1


    else:
        print(f"#{tc} {cnt}")