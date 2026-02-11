# Fxxckin Carrot!!!!!
# I swear that I will NEVER EAT CARROT again 

def grouping_carrot(arr, N):
    '''
    같은 크기의 당근을 묶어 그룹으로 보자!
    그룹 내의 당근 수 배열을 반환하는 함수
    '''
    arr.sort() # 크기 비교를 위한 정렬
    groups = []
    count = 1

    # 1. 당근 배열을 순회하면서 같은 크기의 당근끼리 그룹화
    for idx in range(1, N):

        if arr[idx] == arr[idx-1]:
            count += 1

        else: #이전 값이 현재 값과 다르면
            groups.append(count)
            count = 1
    else: groups.append(count) # 마지막 그룹 업데이트

    return groups

def pack_difference(arr): # 몇 개의 그룹을 포함할 것인가?

    '''
    누적합 개념을 활용해라! 
    누적합 배열을 사용할 경우, 구간을 나눴을 때 당근의 합을
    요소 간 차로 매우 간단히 구할 수 있음

    ex. 1 1 1 2 3 
    ==> groups(빈도수) = [3, 1, 1] (순서대로 크기 1, 2 ,3 당근의 수)
    ==> prefix(누적합) = [3, 4, 5] 

    i = 0, j = 1 기준으로 S, M, L을 나눈다면
    
    중 바구니에 담긴 당근의 수는?

    prefix[j] - prefix[i]

    GPT 너 인정
    '''

    G = len(arr) # N : 그룹의 개수
    prefix = [arr[0]] # prefix : 누적합 배열

    if G < 3:
        return -1

    min_diff = 10000

    for idx in range(1, G):
        prefix.append(prefix[idx-1] + arr[idx])


    # 핵심 : i와 j는 경계선 값이다. arr[:i], arr[i:j], arr[j]
    for i in range(G-2): # 그룹 수 만큼 순회
        for j in range(i+1, G-1): # 해당 그룹을 제외한 나머지 그룹 범위

            S = prefix[i]
            M = prefix[j] - prefix[i]
            L = prefix[G-1] - prefix[j]

            if S > N//2 or M > N//2 or L > N//2: # 불가능한 포장은 skip
                continue

            diff = max(S,M,L) - min(S,M,L)

            if min_diff > diff:
                min_diff = diff

    if min_diff == 10000: # 갱신되지 않았다면
        return -1
    else: return min_diff


import sys
sys.stdin = open('input.txt', 'r')

T = int(input())

for tc in range(1, T+1):

    N = int(input()) # 당근 수

    arr = list(map(int, input().split()))

    grouped_carrot = grouping_carrot(arr, N)

    result = pack_difference(grouped_carrot)

    print(f"#{tc} {result}")