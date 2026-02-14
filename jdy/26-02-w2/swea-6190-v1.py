T = int(input())  #  테스트 케이스 수

# 단조 증가하는 숫자인지 확인하는 함수
def is_increasing(number):
    num_as_str = str(number)
    for i in range(len(num_as_str)-1):
        if num_as_str[i] > num_as_str[i+1]:
            return False
    else:
        return True

for _ in range(1, T+1):
    N = int(input())  # 정수 개수
    int_lst = list(map(int, input().split()))
    candidates = []
    ans = -1  # 정답 저장할 변수(단조 증가하는 숫자가 없다면 -1을 반환하도록 초깃값 -1로 설정)
    # 리스트 내 두 숫자의 곱 가능한 경우의 수를 모두 순회
    for i in range(N):
        for j in range(i+1, N):
            candidate = int_lst[i] * int_lst[j]
            if is_increasing(candidate):   # 만약 단조 증가하는 숫자라면 
                if candidate > ans:  # ans 변수 업데이트
                    ans = candidate
            
    print(f"#{_} {ans}")