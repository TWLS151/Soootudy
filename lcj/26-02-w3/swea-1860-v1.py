'''
저의 비효율적인(?) 시간차 계산 코드를 보고 가시죠...
'''

import sys
from collections import defaultdict # 이거 써보고 싶어서 해봤는데 그냥 arr로 가능할듯
sys.stdin = open('input.txt', 'r')

T = int(input())

def calculate_need_bung(customers):

    timeline = defaultdict(int)

    for time in customers:
        timeline[time] += 1

    return timeline

def is_complete_bung(customers, N, M, K):

    is_complete = True
    cus_time = list(customers.keys())

    if cus_time[0] < M:                 # 1. 만드는 시간보다 빨리 온 손님이 존재 -> 불가능
        is_complete = False
        return is_complete

    now =  0                            # 현재 시각 변수
    current_boong = 0                   # 현재 붕어빵 수
    lefted = 0                          # 시간차 계산 후 남은 시간 (이후에 더해줘야 함)

    for t in customers:                 # 2. 붕어빵 수 계산 : dict의 key 호출

        time_space = t - now + lefted   # 시간차 계산
        maked = (time_space // M) * K   # 손님이 올 때까지 만들 수 있는 붕어빵 수
        lefted = (time_space % M)       # 잔여 시간 (다음 손님 턴 계산 시 더해줘야 함)
        current_boong += maked

        if maked == 0:                  # 3. 다음 손님까지 붕어빵을 만들 수 없을 때

            if current_boong == 0:          # 3-1. 현재 붕어빵이 0개라면
                is_complete = False         # 진기씨는 앞치마를 벗고 붕어빵 가게를 떠나주십시오
                return is_complete

            elif current_boong != 0:        # 3-2. 현재 붕어빵이 있다면

                current_boong -= customers[t]  # 손님 수 만큼 차감

                if current_boong < 0:          # 현재 붕어빵 수가 음수개라면
                    is_complete = False        # 실패 (진기 씨는...)
                    return is_complete

        else:                               # 4. 다음 손님때 붕어빵을 만들 수 있는 경우
            current_boong -= customers[t]   # 손님 수 만큼 차감

            if current_boong < 0:           # 현재 붕어빵 수가 음수개라면
                    is_complete = False     # 실패
                    return is_complete


        # print(f"{t}초 후 남은 붕어빵 수 :", current_boong) - 테스트 코드
        now = t # 현재 시각을 갱신 (다음 시간대 사이 간격 계산을 위해)

    return is_complete



for tc in range(1, T+1):

    n, m, k = map(int, input().split())     # N 손님 수, M초마다 K개 붕어빵
    arr = list(map(int, input().split()))   # 손님 시간대

    time_need = calculate_need_bung(arr)    # time_need = {손님 오는 시간(초) : 손님 수} 로 구성

    result = is_complete_bung(time_need, n, m, k) # 붕어빵 공급 성공 여부 저장

    if result:
        print(f"#{tc} Possible")
    else : print(f"#{tc} Impossible")