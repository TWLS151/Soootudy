import sys
sys.stdin = open('input.txt', 'r')

T = int(input())

def binary_search(P, target, cnt):

    L, R = 1, P # 첫 페이지 L, 마지막 페이지 R (= P)

    while L <= R:

        cnt += 1
        C = int((L + R)/2)

        if C == target:
            return cnt

        elif C > target:
            R = C

        elif C < target:
            L = C

    return float('inf')


for tc in range(1, T+1):

    end_page, a, b = map(int, input().split())

    if binary_search(end_page, a, 0) < binary_search(end_page, b, 0):
        print(f"#{tc} A")

    elif binary_search(end_page, a, 0) > binary_search(end_page, b, 0):
        print(f"#{tc} B")

    else:
        print(f"#{tc} 0")