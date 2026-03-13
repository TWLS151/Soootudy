import sys
sys.stdin = open('input.txt')

T = int(input())

def partition(arr, start, end):

    # 1. pivot 설정
    pivot = arr[end]

    # 2. i 포인터(피벗보다 작은 값들을 순회할 포인터)
    i = start - 1

    # 3. 현재값 포인터가 이동하며 정해진 작업을 수행
    for j in range(start, end):

        if arr[j] < pivot:                          # 만약 현재 인덱스 값이 피벗보다 작다면
            i += 1                                  # i 포인터를 이동 (i는 결국 순회 마다 피벗보다 작은 값들 중 최대 인덱스가 됨)

            if i != j:                              # i 포인터와 j 포인터의 위치가 다를 경우
                arr[i], arr[j] = arr[j], arr[i]     # <해석> 현재 인덱스(j)가 지나온 자리에 피벗보다 큰 값이 있었다 -> 둘의 위치를 변경
                                                    # <원인> pivot보다 큰 값을 지나치면, 둘 간의 간격이 생기게 됨
                                                    # <효과> pivot보다 큰 값을 계속 밀어낸다. (작은 값과 위치를 바꾼다)

    # 4. j가 순회를 마친 이후 -> i == 피벗보다 작은 값 중 가장 오른쪽(최대 인덱스) 값
    arr[i + 1], arr[end] = arr[end], arr[i + 1]

    # 5. 최종적으로 반환해야 할 것 - 피벗의 인덱스 (해당 인덱스는 고정이므로 재귀 탐색에서 제외)
    return i + 1

def quick_sort(arr, start, end):

    if start >= end:    # 의미 : 길이가 1인 경우 - 이미 정렬된 상태임
        return

    pivot_idx = partition(arr, start, end)      # 피벗 인덱스 구하기

    quick_sort(arr, start, pivot_idx - 1)       # 피벗의 왼쪽 영역에 대해 퀵 정렬

    quick_sort(arr, pivot_idx + 1, end)         # 피벗의 오른쪽 영역에 대해 퀵 정렬


for tc in range(1, T+1):

    N = int(input())
    arr = list(map(int, input().split()))

    quick_sort(arr, 0, len(arr)-1)

    print(f"#{tc} {arr[N//2]}")