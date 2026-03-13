import sys
sys.stdin = open('input.txt', 'r')

T = int(input())

def merge(left, right):

    global count        # 경우의 수 수정을 위한 global

    merged = []         # 정렬된 리스트
    i = j = 0           # left, right 포인터

    while i < len(left) and j < len(right): # 비교할 원소쌍이 남을 때까지

        if left[i] <= right[j]:             # 포인터 이동하며 차례대로 병합
            merged.append(left[i])
            i += 1

        elif left[i] > right[j]:
            merged.append(right[j])
            j += 1

    if j == len(right): # 오른쪽 리스트를 끝까지 돌았다면 -> 왼쪽 끝 원소가 더 큰 것이므로 경우의 수 +1
        merged.extend(left[i:])
        count += 1

    elif i == len(left):
        merged.extend(right[j:])

    return merged   # 병합된 리스트를 반환

def merge_sort(arr):

    if len(arr) <= 1:               # 길이가 1 - 이미 정렬됨
        return arr

    mid = len(arr) // 2             # 인덱스 중간값

    left = arr[:mid]
    right = arr[mid:]

    left_sorted = merge_sort(left)
    right_sorted = merge_sort(right)

    return merge(left_sorted, right_sorted)

for tc in range(1, T+1):

    N = int(input())
    arr = list(map(int, input().split()))
    count = 0

    merged_arr = merge_sort(arr)

    print(f"#{tc} {merged_arr[N//2]} {count}")