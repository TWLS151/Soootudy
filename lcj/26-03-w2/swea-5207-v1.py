import sys
sys.stdin = open('input.txt', 'r')

T = int(input())

def binary_search(arr, target):

    count = 0    # 조건 충족 여부를 확인하기 위한 변수 추가
    L = 0
    R = N - 1 # A 리스트의 끝 인덱스

    mid = (L + R) // 2

    is_left = False
    is_right = False

    while L <= R:

        mid = (L + R) // 2

        if arr[mid] == target:
            count += 1
            return count

        elif target < arr[mid]:   # 왼쪽 구간을 탐색해야 할 때

            if is_left:    # 이전에 오른쪽 탐색을 안했다면 -> 조건 미충족
                break

            R = mid - 1
            is_right = False
            is_left = True

        elif target > mid:    # 오른쪽 구간을 탐색해야 할 때

            if is_right:     # 이전에 왼쪽 탐색을 안했었다면 -> 조건 미충족
                break

            L = mid + 1
            is_left = False
            is_right = True

    return count

for tc in range(1, T+1):

    N, M = map(int, input().split())
    sorted_lst = sorted(list(map(int, input().split())))
    target_lst = list(map(int, input().split()))

    total = 0

    for target in target_lst:

        if target not in sorted_lst:
            continue

        total += binary_search(sorted_lst, target)

    print(f"#{tc} {total}")